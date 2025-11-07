import { Message } from 'whatsapp-web.js';
import { createClient } from '@/lib/supabase/server';
import { generateAIResponse, validateOpenAIConfig } from '@/lib/openai/client';
import { BotConfig, MiniTask } from '@/types';

interface MessageHandlerConfig {
  userId: string;
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
      await logMessage(userId, message, null, false, true);
      return;
    }

    // Validar configuración de OpenAI
    const validation = validateOpenAIConfig(botConfig);
    if (!validation.valid) {
      console.error('Configuración de OpenAI inválida:', validation.error);
      return;
    }

    // Obtener mini tareas activas
    const { data: miniTasks } = await supabase
      .from('mini_tasks')
      .select('*')
      .eq('bot_config_id', botConfig.id)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    // Generar respuesta
    const messageText = message.body;
    const senderNumber = message.from;

    const response = await generateAIResponse({
      config: botConfig,
      context: {
        senderNumber,
        messageText,
      },
      miniTasks: miniTasks || [],
    });

    // Enviar respuesta
    await message.reply(response);

    // Registrar en la base de datos
    const wasMiniTask = miniTasks?.some(task =>
      messageText.toLowerCase().includes(task.trigger_keyword.toLowerCase())
    ) || false;

    await logMessage(userId, message, response, wasMiniTask, false);

    // Actualizar métricas
    await updateMetrics(userId);

  } catch (error) {
    console.error('Error al manejar mensaje:', error);

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
  wasAutomated: boolean,
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
      was_automated: wasAutomated,
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
