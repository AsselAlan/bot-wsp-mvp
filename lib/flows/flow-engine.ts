import { MessageFlow, FlowConversationState, FlowStep, BotConfig } from '@/types';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

/**
 * Detecta si un mensaje debe activar algún flujo
 */
export async function detectFlowActivation(
  userId: string,
  messageText: string,
  botConfig: BotConfig
): Promise<MessageFlow | null> {
  try {
    const supabase = await createClient();

    // Obtener flujos activos del usuario
    const { data: flows, error } = await supabase
      .from('message_flows')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_default', { ascending: false }); // Priorizar flujos no predeterminados

    if (error || !flows || flows.length === 0) {
      return null;
    }

    // Intentar match con cada flujo
    for (const flow of flows) {
      const isActivated = await checkFlowActivation(flow, messageText, botConfig);
      if (isActivated) {
        return flow;
      }
    }

    return null;
  } catch (error) {
    console.error('Error al detectar activación de flujo:', error);
    return null;
  }
}

/**
 * Verifica si un flujo específico debe activarse
 */
async function checkFlowActivation(
  flow: MessageFlow,
  messageText: string,
  botConfig: BotConfig
): Promise<boolean> {
  try {
    if (flow.activation_type === 'keywords') {
      // Activación por palabras clave
      if (!flow.activation_keywords || flow.activation_keywords.length === 0) {
        return false;
      }

      const messageLower = messageText.toLowerCase();
      return flow.activation_keywords.some(keyword =>
        messageLower.includes(keyword.toLowerCase())
      );
    } else if (flow.activation_type === 'ai') {
      // Activación por IA
      if (!flow.activation_prompt || !botConfig.openai_api_key) {
        return false;
      }

      const openai = new OpenAI({ apiKey: botConfig.openai_api_key });

      const prompt = `Analiza el siguiente mensaje del usuario y determina si coincide con esta intención:

Intención buscada: ${flow.activation_prompt}

Mensaje del usuario: ${messageText}

Responde SOLO con un JSON en este formato exacto:
{"matches": true/false, "confidence": 0-100}`;

      const response = await openai.chat.completions.create({
        model: botConfig.openai_model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 100,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        return false;
      }

      const result = JSON.parse(content);
      return result.matches && result.confidence >= 70;
    }

    return false;
  } catch (error) {
    console.error('Error al verificar activación de flujo:', error);
    return false;
  }
}

/**
 * Obtiene el estado actual de conversación en un flujo
 */
export async function getFlowConversationState(
  userId: string,
  chatId: string
): Promise<FlowConversationState | null> {
  try {
    const supabase = await createClient();

    const { data: state, error } = await supabase
      .from('flow_conversation_states')
      .select('*')
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .eq('is_completed', false)
      .eq('is_cancelled', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !state) {
      return null;
    }

    // Verificar si expiró
    if (state.expires_at && new Date(state.expires_at) < new Date()) {
      await cancelFlowState(state.id);
      return null;
    }

    return state;
  } catch (error) {
    console.error('Error al obtener estado de flujo:', error);
    return null;
  }
}

/**
 * Inicia un nuevo flujo de conversación
 */
export async function startFlowConversation(
  userId: string,
  flowId: string,
  chatId: string,
  customerWhatsappId: string,
  flow: MessageFlow
): Promise<FlowConversationState | null> {
  try {
    const supabase = await createClient();

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + flow.timeout_minutes);

    const { data: state, error } = await supabase
      .from('flow_conversation_states')
      .insert({
        user_id: userId,
        flow_id: flowId,
        chat_id: chatId,
        customer_whatsapp_id: customerWhatsappId,
        current_step: 1,
        collected_data: {},
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error al iniciar flujo:', error);
      return null;
    }

    return state;
  } catch (error) {
    console.error('Error al crear estado de flujo:', error);
    return null;
  }
}

/**
 * Procesa un mensaje dentro de un flujo activo
 */
export async function processFlowMessage(
  flow: MessageFlow,
  state: FlowConversationState,
  messageText: string,
  botConfig: BotConfig
): Promise<{ response: string; isCompleted: boolean; nextStep?: number }> {
  try {
    const currentStepIndex = state.current_step - 1;
    const currentStep = flow.steps[currentStepIndex];

    if (!currentStep) {
      return {
        response: flow.error_message,
        isCompleted: true,
      };
    }

    // Generar respuesta del bot para este paso
    const botResponse = currentStep.bot_response;

    // Guardar datos recopilados
    const supabase = await createClient();
    const collectedData = {
      ...state.collected_data,
      [`step_${state.current_step}`]: {
        user_message: messageText,
        bot_response: botResponse,
        timestamp: new Date().toISOString(),
      },
    };

    // Verificar si es el último paso
    const isLastStep = state.current_step >= flow.steps.length;

    if (isLastStep) {
      // Completar el flujo
      await supabase
        .from('flow_conversation_states')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          collected_data: collectedData,
          last_interaction_at: new Date().toISOString(),
        })
        .eq('id', state.id);

      // Ejecutar acción final
      await executeFinalAction(flow, state, collectedData, botConfig);

      return {
        response: botResponse + '\n\n✓ Proceso completado exitosamente.',
        isCompleted: true,
      };
    } else {
      // Avanzar al siguiente paso
      const nextStep = state.current_step + 1;

      await supabase
        .from('flow_conversation_states')
        .update({
          current_step: nextStep,
          collected_data: collectedData,
          last_interaction_at: new Date().toISOString(),
        })
        .eq('id', state.id);

      // Obtener mensaje del siguiente paso
      const nextStepData = flow.steps[nextStep - 1];
      const nextResponse = nextStepData ? nextStepData.bot_response : botResponse;

      return {
        response: nextResponse,
        isCompleted: false,
        nextStep,
      };
    }
  } catch (error) {
    console.error('Error al procesar mensaje en flujo:', error);
    return {
      response: flow.error_message,
      isCompleted: true,
    };
  }
}

/**
 * Cancela un estado de flujo
 */
export async function cancelFlowState(stateId: string): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase
      .from('flow_conversation_states')
      .update({
        is_cancelled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stateId);
  } catch (error) {
    console.error('Error al cancelar flujo:', error);
  }
}

/**
 * Ejecuta la acción final del flujo
 */
async function executeFinalAction(
  flow: MessageFlow,
  state: FlowConversationState,
  collectedData: Record<string, any>,
  botConfig: BotConfig
): Promise<void> {
  try {
    const actionType = flow.final_action.type;
    const actionConfig = flow.final_action.config;

    switch (actionType) {
      case 'create_order':
        await executeCreateOrder(flow, state, collectedData, botConfig);
        break;

      case 'send_notification':
        await executeSendNotification(flow, state, collectedData);
        break;

      case 'save_info':
        await executeSaveInfo(flow, state, collectedData);
        break;

      case 'webhook':
        await executeWebhook(flow, state, collectedData, actionConfig);
        break;

      default:
        console.log('Tipo de acción no reconocido:', actionType);
    }
  } catch (error) {
    console.error('Error al ejecutar acción final:', error);
  }
}

/**
 * Acción: Crear pedido
 */
async function executeCreateOrder(
  flow: MessageFlow,
  state: FlowConversationState,
  collectedData: Record<string, any>,
  botConfig: BotConfig
): Promise<void> {
  try {
    console.log('Ejecutando acción: Crear pedido');
    console.log('Datos recopilados:', collectedData);

    const supabase = await createClient();

    // Extraer datos de los pasos del flujo
    const flowData = extractDataFromFlow(collectedData, flow.steps.length);

    // Construir la conversación completa para análisis con IA
    const conversationText = Object.values(collectedData)
      .map((step: any) => `Usuario: ${step.user_message}\nBot: ${step.bot_response}`)
      .join('\n\n');

    // Usar IA para extraer información estructurada del pedido
    const orderInfo = await extractOrderInfoFromFlowData(
      conversationText,
      flowData,
      botConfig
    );

    if (!orderInfo) {
      console.error('No se pudo extraer información del pedido del flujo');
      return;
    }

    // Obtener configuración de pedidos
    const { data: orderConfig } = await supabase
      .from('order_config')
      .select('*')
      .eq('user_id', state.user_id)
      .single();

    if (!orderConfig) {
      console.error('No se encontró configuración de pedidos');
      return;
    }

    // Generar número de pedido
    const { data: orderNumber } = await supabase.rpc('generate_order_number', {
      p_user_id: state.user_id,
    });

    // Calcular costos
    const subtotal = orderInfo.items?.reduce(
      (sum: number, item: any) => sum + (item.precio || 0) * (item.cantidad || 0),
      0
    ) || 0;

    let deliveryCost = 0;
    if (orderInfo.delivery_address?.zona && orderConfig.delivery_zones) {
      const zone = orderConfig.delivery_zones.find(
        (z: any) => z.nombre.toLowerCase() === orderInfo.delivery_address.zona.toLowerCase()
      );
      if (zone) {
        deliveryCost = zone.costo;
      }
    }

    const total = subtotal + deliveryCost;

    // Crear el pedido con estado 'pending'
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: state.user_id,
        order_number: orderNumber || `${Date.now()}`,
        status: 'pending', // Siempre pending para que el dueño confirme
        customer_name: orderInfo.customer_name || 'Cliente',
        customer_phone: state.customer_whatsapp_id.replace('@c.us', ''),
        customer_whatsapp_id: state.customer_whatsapp_id,
        items: orderInfo.items || [],
        delivery_address: orderInfo.delivery_address || {},
        payment_method: orderInfo.payment_method,
        payment_status: 'pending',
        subtotal,
        delivery_cost: deliveryCost,
        total,
        estimated_delivery_time: orderConfig.default_delivery_time || '30-45 minutos',
        customer_notes: orderInfo.customer_notes,
        conversation_snapshot: collectedData, // Guardar el snapshot del flujo completo
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear pedido desde flujo:', error);
      return;
    }

    console.log(`Pedido creado exitosamente desde flujo: ${order.order_number}`);

    // Actualizar el estado del flujo con el ID del pedido creado
    await supabase
      .from('flow_conversation_states')
      .update({
        collected_data: {
          ...collectedData,
          created_order_id: order.id,
          created_order_number: order.order_number,
        },
      })
      .eq('id', state.id);

  } catch (error) {
    console.error('Error al ejecutar creación de pedido:', error);
  }
}

/**
 * Extrae datos relevantes de los pasos del flujo
 */
function extractDataFromFlow(collectedData: Record<string, any>, totalSteps: number): {
  productos?: string;
  direccion?: string;
  pago?: string;
} {
  const flowData: any = {};

  // Intentar extraer datos de cada paso
  // Asumiendo que:
  // - Paso 1: productos
  // - Paso 2: dirección
  // - Paso 3: método de pago
  // - Paso 4+: confirmación/otros

  if (collectedData.step_1) {
    flowData.productos = collectedData.step_1.user_message;
  }

  if (collectedData.step_2) {
    flowData.direccion = collectedData.step_2.user_message;
  }

  if (collectedData.step_3) {
    flowData.pago = collectedData.step_3.user_message;
  }

  return flowData;
}

/**
 * Extrae información estructurada usando IA desde los datos del flujo
 */
async function extractOrderInfoFromFlowData(
  conversationText: string,
  flowData: any,
  botConfig: BotConfig
): Promise<any | null> {
  try {
    if (!botConfig.openai_api_key) {
      console.error('No hay API key de OpenAI configurada');
      return null;
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: botConfig.openai_api_key });

    const prompt = `Extrae la información del pedido de la siguiente conversación de un flujo de toma de pedidos.

Conversación completa:
${conversationText}

Extrae TODA la información disponible del pedido. Si un campo no está mencionado, déjalo como null.

Responde SOLO con un JSON en este formato exacto:
{
  "customer_name": "nombre del cliente o null",
  "items": [
    {
      "producto": "nombre del producto",
      "cantidad": número,
      "precio": precio unitario o null,
      "detalles": "detalles adicionales o null"
    }
  ],
  "delivery_address": {
    "calle": "nombre de la calle o null",
    "numero": "número o null",
    "piso_depto": "piso/depto o null",
    "barrio": "barrio o null",
    "zona": "zona de delivery o null",
    "referencias": "referencias adicionales o null"
  },
  "payment_method": "efectivo/transferencia/otro o null",
  "customer_notes": "notas adicionales del cliente o null"
}

Importante:
- Si items está vacío, retorna []
- Si no hay dirección, retorna un objeto con todos los campos en null
- Sé preciso con las cantidades y productos
- Intenta inferir información aunque no esté explícita`;

    const response = await openai.chat.completions.create({
      model: botConfig.openai_model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return null;
    }

    const orderInfo = JSON.parse(content);
    return orderInfo;

  } catch (error) {
    console.error('Error al extraer información del pedido con IA:', error);
    return null;
  }
}

/**
 * Acción: Enviar notificación
 */
async function executeSendNotification(
  flow: MessageFlow,
  state: FlowConversationState,
  collectedData: Record<string, any>
): Promise<void> {
  console.log('Ejecutando acción: Enviar notificación');
  console.log('Datos recopilados:', collectedData);
  // TODO: Implementar envío de notificación
}

/**
 * Acción: Guardar información
 */
async function executeSaveInfo(
  flow: MessageFlow,
  state: FlowConversationState,
  collectedData: Record<string, any>
): Promise<void> {
  console.log('Ejecutando acción: Guardar información');
  // Los datos ya están guardados en flow_conversation_states
  // Aquí podrías copiarlos a otra tabla si es necesario
}

/**
 * Acción: Llamar webhook
 */
async function executeWebhook(
  flow: MessageFlow,
  state: FlowConversationState,
  collectedData: Record<string, any>,
  config: Record<string, any>
): Promise<void> {
  try {
    if (!config.webhook_url) {
      console.error('No se configuró URL de webhook');
      return;
    }

    const response = await fetch(config.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flow_id: flow.id,
        flow_name: flow.name,
        customer_whatsapp_id: state.customer_whatsapp_id,
        collected_data: collectedData,
        completed_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('Error al llamar webhook:', response.statusText);
    } else {
      console.log('Webhook llamado exitosamente');
    }
  } catch (error) {
    console.error('Error al ejecutar webhook:', error);
  }
}
