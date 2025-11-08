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
      const nextResponse = nextStepData ? `${botResponse}\n\n${nextStepData.bot_response}` : botResponse;

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
  // TODO: Implementar creación de pedido usando extractOrderInformation
  console.log('Ejecutando acción: Crear pedido');
  console.log('Datos recopilados:', collectedData);
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
