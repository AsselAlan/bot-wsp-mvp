import { Message, Client } from 'whatsapp-web.js';
import { createClient } from '@/lib/supabase/server';
import { generateAIResponse, validateOpenAIConfig } from '@/lib/openai/client';
import { BotConfig, OrderConfig } from '@/types';
import OpenAI from 'openai';
import {
  detectFlowActivation,
  getFlowConversationState,
  startFlowConversation,
  processFlowMessage,
} from '@/lib/flows/flow-engine';

interface MessageHandlerConfig {
  userId: string;
  whatsappClient?: Client;
}

/**
 * Maneja los mensajes entrantes de WhatsApp
 */
export async function handleIncomingMessage(
  message: Message,
  config: MessageHandlerConfig
): Promise<void> {
  try {
    const { userId } = config;

    // Ignorar mensajes propios y de grupos (opcional)
    if (message.fromMe) {
      return;
    }

    const supabase = await createClient();

    // Obtener la configuración del bot
    const { data: botConfig, error: configError } = await supabase
      .from('bot_configs')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (configError || !botConfig) {
      console.error('No se encontró configuración del bot:', configError);
      return;
    }

    // Verificar si el bot está activo
    if (!botConfig.is_active) {
      console.log('Bot pausado, no se procesará el mensaje');
      // Registrar el mensaje pero no responder
      await logMessage(userId, message, null, true);
      return;
    }

    // Validar configuración de OpenAI
    const validation = validateOpenAIConfig(botConfig);
    if (!validation.valid) {
      console.error('Configuración de OpenAI inválida:', validation.error);
      return;
    }

    // Generar respuesta
    const messageText = message.body;
    const senderNumber = message.from;
    const chat = await message.getChat();

    let response: string | null = null;
    let errorReason: 'out_of_context' | 'no_match' | 'api_error' | 'paused' | null = null;
    let isFlowResponse = false;

    try {
      // PRIORIDAD 1: Verificar si hay un flujo activo para este chat
      const activeFlowState = await getFlowConversationState(userId, chat.id._serialized);

      if (activeFlowState) {
        console.log(`Procesando mensaje en flujo activo (step ${activeFlowState.current_step})`);

        // Obtener el flujo completo
        const { data: flow } = await supabase
          .from('message_flows')
          .select('*')
          .eq('id', activeFlowState.flow_id)
          .single();

        if (flow) {
          const flowResult = await processFlowMessage(flow, activeFlowState, messageText, botConfig);
          response = flowResult.response;
          isFlowResponse = true;

          console.log(`Flujo procesado. Completado: ${flowResult.isCompleted}`);
        }
      } else {
        // PRIORIDAD 2: Verificar si el mensaje debe activar un nuevo flujo
        const flowToActivate = await detectFlowActivation(userId, messageText, botConfig);

        if (flowToActivate) {
          console.log(`Activando flujo: ${flowToActivate.name}`);

          // Iniciar el flujo
          const flowState = await startFlowConversation(
            userId,
            flowToActivate.id,
            chat.id._serialized,
            senderNumber,
            flowToActivate
          );

          if (flowState && flowToActivate.steps.length > 0) {
            // Enviar mensaje del primer paso
            const firstStep = flowToActivate.steps[0];
            response = firstStep.bot_response;
            isFlowResponse = true;

            console.log('Flujo iniciado exitosamente');
          }
        } else {
          // PRIORIDAD 3: Respuesta normal con IA (sin flujo)
          const conversationHistory = await getConversationHistory(
            userId,
            chat.id._serialized
          );

          response = await generateAIResponse({
            config: botConfig,
            context: {
              senderNumber,
              messageText,
              conversationHistory,
            },
          });

          // Verificar si se pudo generar una respuesta
          if (!response || response.trim() === '') {
            errorReason = 'no_match';
          }
        }
      }
    } catch (error) {
      console.error('Error al generar respuesta con OpenAI:', error);
      errorReason = 'api_error';
    }

    // Si hubo algún error o no hay respuesta, guardar como mensaje sin responder
    if (errorReason) {
      await saveUnansweredMessage(
        userId,
        chat.id._serialized,
        senderNumber,
        messageText,
        errorReason
      );

      // Enviar notificación si está habilitado
      if (config.whatsappClient && botConfig.enable_unanswered_notifications && botConfig.notification_number) {
        await sendUnansweredNotification(
          config.whatsappClient,
          botConfig.notification_number,
          senderNumber,
          messageText
        );
      }

      // Registrar mensaje sin respuesta
      await logMessage(userId, message, null, false, false);
      return;
    }

    // Enviar respuesta (response ya fue validado que no es null arriba)
    await message.reply(response!);

    // Registrar en la base de datos
    await logMessage(userId, message, response!, false);

    // Detectar y procesar pedidos si está habilitado
    await detectAndProcessOrder(
      userId,
      chat.id._serialized,
      senderNumber,
      messageText,
      botConfig,
      config.whatsappClient
    );

    // Actualizar métricas
    await updateMetrics(userId);

  } catch (error) {
    console.error('Error al manejar mensaje:', error);

    // Intentar guardar como mensaje sin responder con error
    try {
      const chat = await message.getChat();
      await saveUnansweredMessage(
        config.userId,
        chat.id._serialized,
        message.from,
        message.body,
        'api_error'
      );
    } catch (saveError) {
      console.error('No se pudo guardar mensaje sin responder:', saveError);
    }

    // Intentar enviar mensaje de error al usuario
    try {
      await message.reply('Lo siento, hubo un error al procesar tu mensaje. Por favor intenta nuevamente.');
    } catch (replyError) {
      console.error('No se pudo enviar mensaje de error:', replyError);
    }
  }
}

/**
 * Registra un mensaje en la base de datos
 */
async function logMessage(
  userId: string,
  message: Message,
  botResponse: string | null,
  wasPaused: boolean
): Promise<void> {
  try {
    const supabase = await createClient();

    const chat = await message.getChat();
    const contact = await message.getContact();

    await supabase.from('message_logs').insert({
      user_id: userId,
      chat_id: chat.id._serialized,
      sender_number: contact.number || message.from,
      message_text: message.body,
      bot_response: wasPaused ? null : botResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error al registrar mensaje:', error);
  }
}

/**
 * Actualiza las métricas diarias del usuario
 */
async function updateMetrics(userId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // Buscar métrica de hoy
    const { data: existingMetric } = await supabase
      .from('chat_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (existingMetric) {
      // Actualizar métrica existente
      await supabase
        .from('chat_metrics')
        .update({
          daily_chats: existingMetric.daily_chats + 1,
          bot_responses: existingMetric.bot_responses + 1,
        })
        .eq('id', existingMetric.id);
    } else {
      // Crear nueva métrica
      // Obtener total de chats históricos
      const { count } = await supabase
        .from('message_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      await supabase.from('chat_metrics').insert({
        user_id: userId,
        date: today,
        total_chats: count || 0,
        daily_chats: 1,
        bot_responses: 1,
      });
    }
  } catch (error) {
    console.error('Error al actualizar métricas:', error);
  }
}

/**
 * Obtiene el historial de conversación reciente (últimos 5 mensajes)
 */
export async function getConversationHistory(
  userId: string,
  chatId: string
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  try {
    const supabase = await createClient();

    const { data: messages } = await supabase
      .from('message_logs')
      .select('message_text, bot_response')
      .eq('user_id', userId)
      .eq('chat_id', chatId)
      .order('timestamp', { ascending: false })
      .limit(5);

    if (!messages) return [];

    // Convertir a formato de OpenAI (invertir orden para tener cronológico)
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    messages.reverse().forEach(msg => {
      history.push({ role: 'user', content: msg.message_text });
      if (msg.bot_response) {
        history.push({ role: 'assistant', content: msg.bot_response });
      }
    });

    return history;
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return [];
  }
}

/**
 * Guarda un mensaje sin responder en la base de datos
 */
async function saveUnansweredMessage(
  userId: string,
  chatId: string,
  senderNumber: string,
  messageText: string,
  reason: 'out_of_context' | 'no_match' | 'api_error' | 'paused'
): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase.from('unanswered_messages').insert({
      user_id: userId,
      chat_id: chatId,
      sender_number: senderNumber,
      message_text: messageText,
      attempted_response: null,
      reason: reason,
      is_reviewed: false,
    });

    console.log(`Mensaje sin responder guardado. Razón: ${reason}`);
  } catch (error) {
    console.error('Error al guardar mensaje sin responder:', error);
  }
}

/**
 * Envía una notificación por WhatsApp al número configurado
 */
async function sendUnansweredNotification(
  client: Client,
  notificationNumber: string,
  senderNumber: string,
  messageText: string
): Promise<void> {
  try {
    // Formatear el número de notificación (agregar @c.us si no lo tiene)
    const formattedNumber = notificationNumber.includes('@c.us')
      ? notificationNumber
      : `${notificationNumber.replace(/[^\d]/g, '')}@c.us`;

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-AR');
    const timeStr = now.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const notificationMessage = `🚨 *Mensaje sin responder*\n\nDe: ${senderNumber}\nMensaje: ${messageText}\nFecha: ${dateStr} ${timeStr}\n\nRevisa el dashboard para crear una respuesta.`;

    await client.sendMessage(formattedNumber, notificationMessage);
    console.log(`Notificación enviada a ${notificationNumber}`);
  } catch (error) {
    console.error('Error al enviar notificación:', error);
  }
}

/**
 * Detecta y procesa pedidos automáticamente
 */
async function detectAndProcessOrder(
  userId: string,
  chatId: string,
  senderNumber: string,
  messageText: string,
  botConfig: BotConfig,
  whatsappClient?: Client
): Promise<void> {
  try {
    const supabase = await createClient();

    // Obtener configuración de pedidos
    const { data: orderConfig } = await supabase
      .from('order_config')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Si no está habilitada la toma de pedidos, salir
    if (!orderConfig || !orderConfig.enable_order_taking) {
      return;
    }

    // Obtener historial de conversación para contexto
    const conversationHistory = await getConversationHistory(userId, chatId);

    // Detectar si el mensaje contiene intención de pedido
    const orderDetection = await detectOrderIntent(
      messageText,
      conversationHistory,
      botConfig
    );

    if (!orderDetection.isOrder) {
      return;
    }

    console.log('Pedido detectado, extrayendo información...');

    // Extraer información estructurada del pedido
    const orderInfo = await extractOrderInformation(
      conversationHistory,
      messageText,
      botConfig
    );

    if (!orderInfo) {
      console.log('No se pudo extraer información del pedido');
      return;
    }

    // Validar campos requeridos según configuración
    const validation = validateOrderInformation(orderInfo, orderConfig);

    if (!validation.isValid) {
      console.log('Pedido incompleto:', validation.missingFields);

      // Enviar mensaje solicitando información faltante
      if (whatsappClient && orderConfig.missing_info_message) {
        const missingFieldsText = validation.missingFields.join(', ');
        const message = orderConfig.missing_info_message.replace(
          '{missing_fields}',
          missingFieldsText
        );

        const formattedNumber = chatId;
        await whatsappClient.sendMessage(formattedNumber, message);
      }

      return;
    }

    // Validar zona de delivery si es necesario
    if (orderInfo.delivery_address?.zona && orderConfig.delivery_zones?.length > 0) {
      const validZone = orderConfig.delivery_zones.find(
        (z: any) => z.nombre.toLowerCase() === orderInfo.delivery_address.zona.toLowerCase()
      );

      if (!validZone) {
        console.log('Zona de delivery no válida');

        if (whatsappClient && orderConfig.out_of_zone_message) {
          const zones = orderConfig.delivery_zones.map((z: any) => z.nombre).join(', ');
          const message = orderConfig.out_of_zone_message.replace('{zones}', zones);

          await whatsappClient.sendMessage(chatId, message);
        }

        return;
      }
    }

    // Crear el pedido en la base de datos
    const order = await createOrder(userId, senderNumber, chatId, orderInfo, orderConfig);

    if (!order) {
      console.error('Error al crear el pedido');
      return;
    }

    console.log('Pedido creado exitosamente:', order.order_number);

    // Enviar mensaje de confirmación
    if (whatsappClient && orderConfig.order_confirmation_message) {
      const confirmationMessage = orderConfig.order_confirmation_message
        .replace('{order_number}', order.order_number)
        .replace('{estimated_time}', orderConfig.default_delivery_time || '30-45 minutos');

      await whatsappClient.sendMessage(chatId, confirmationMessage);
    }

  } catch (error) {
    console.error('Error al detectar/procesar pedido:', error);
  }
}

/**
 * Detecta si un mensaje contiene intención de hacer un pedido
 */
async function detectOrderIntent(
  messageText: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  botConfig: BotConfig
): Promise<{ isOrder: boolean; confidence: number }> {
  try {
    if (!botConfig.openai_api_key) {
      return { isOrder: false, confidence: 0 };
    }

    const openai = new OpenAI({ apiKey: botConfig.openai_api_key });

    const prompt = `Analiza la siguiente conversación y el último mensaje del cliente para determinar si contiene la intención de realizar un pedido.

Conversación previa:
${conversationHistory.map(msg => `${msg.role === 'user' ? 'Cliente' : 'Bot'}: ${msg.content}`).join('\n')}

Último mensaje del cliente: ${messageText}

Indicadores de pedido:
- Menciona productos específicos con cantidades
- Solicita hacer un pedido
- Pregunta por precios y luego confirma
- Proporciona dirección de envío
- Menciona método de pago
- Dice palabras como "quiero", "pedido", "comprar", "encargar", "delivery"

Responde SOLO con un JSON en este formato exacto:
{"isOrder": true/false, "confidence": 0-100}`;

    const response = await openai.chat.completions.create({
      model: botConfig.openai_model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return { isOrder: false, confidence: 0 };
    }

    const result = JSON.parse(content);
    return {
      isOrder: result.isOrder && result.confidence >= 70,
      confidence: result.confidence || 0,
    };

  } catch (error) {
    console.error('Error al detectar intención de pedido:', error);
    return { isOrder: false, confidence: 0 };
  }
}

/**
 * Extrae información estructurada del pedido
 */
async function extractOrderInformation(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  currentMessage: string,
  botConfig: BotConfig
): Promise<any | null> {
  try {
    if (!botConfig.openai_api_key) {
      return null;
    }

    const openai = new OpenAI({ apiKey: botConfig.openai_api_key });

    const prompt = `Extrae la información del pedido de la siguiente conversación.

Conversación completa:
${conversationHistory.map(msg => `${msg.role === 'user' ? 'Cliente' : 'Bot'}: ${msg.content}`).join('\n')}
Cliente: ${currentMessage}

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
- Sé preciso con las cantidades y productos`;

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
    console.error('Error al extraer información del pedido:', error);
    return null;
  }
}

/**
 * Valida que el pedido tenga toda la información requerida
 */
function validateOrderInformation(
  orderInfo: any,
  orderConfig: any
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  // Validar items (siempre requerido)
  if (!orderInfo.items || orderInfo.items.length === 0) {
    missingFields.push('productos del pedido');
  }

  // Validar nombre del cliente
  if (orderConfig.require_customer_name && !orderInfo.customer_name) {
    missingFields.push('tu nombre');
  }

  // Validar dirección de envío
  if (orderConfig.require_delivery_address) {
    const addr = orderInfo.delivery_address;
    if (!addr || !addr.calle || !addr.numero || !addr.barrio) {
      missingFields.push('dirección completa (calle, número, barrio)');
    }
  }

  // Validar método de pago
  if (orderConfig.require_payment_method && !orderInfo.payment_method) {
    missingFields.push('método de pago');
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Crea un pedido en la base de datos
 */
async function createOrder(
  userId: string,
  customerPhone: string,
  customerWhatsappId: string,
  orderInfo: any,
  orderConfig: any
): Promise<any | null> {
  try {
    const supabase = await createClient();

    // Generar número de pedido
    const { data: orderNumber } = await supabase.rpc('generate_order_number', {
      p_user_id: userId,
    });

    // Calcular subtotal
    const subtotal = orderInfo.items.reduce(
      (sum: number, item: any) => sum + (item.precio || 0) * item.cantidad,
      0
    );

    // Obtener costo de delivery según zona
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

    // Obtener nombre del contacto si está disponible
    const contactName = orderInfo.customer_name || 'Cliente';

    // Insertar pedido
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: orderNumber || `${Date.now()}`,
        status: orderConfig.auto_confirm_orders ? 'confirmed' : 'pending',
        customer_name: contactName,
        customer_phone: customerPhone,
        customer_whatsapp_id: customerWhatsappId,
        items: orderInfo.items,
        delivery_address: orderInfo.delivery_address || {},
        payment_method: orderInfo.payment_method,
        payment_status: 'pending',
        subtotal,
        delivery_cost: deliveryCost,
        total,
        estimated_delivery_time: orderConfig.default_delivery_time || '30-45 minutos',
        customer_notes: orderInfo.customer_notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error al insertar pedido:', error);
      return null;
    }

    return order;

  } catch (error) {
    console.error('Error al crear pedido:', error);
    return null;
  }
}
