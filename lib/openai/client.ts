import OpenAI from 'openai';
import { BotConfig, MiniTask } from '@/types';

interface MessageContext {
  senderNumber: string;
  messageText: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

interface GenerateResponseOptions {
  config: BotConfig;
  context: MessageContext;
  miniTasks: MiniTask[];
}

/**
 * Verifica si un mensaje coincide con alguna mini tarea activa
 */
export function checkMiniTasks(messageText: string, miniTasks: MiniTask[]): string | null {
  const normalizedMessage = messageText.toLowerCase().trim();

  // Ordenar por prioridad (mayor primero)
  const sortedTasks = [...miniTasks]
    .filter(task => task.is_active)
    .sort((a, b) => b.priority - a.priority);

  // Buscar coincidencia
  for (const task of sortedTasks) {
    if (normalizedMessage.includes(task.trigger_keyword.toLowerCase())) {
      return task.response_text;
    }
  }

  return null;
}

/**
 * Genera una respuesta usando OpenAI
 */
export async function generateAIResponse(options: GenerateResponseOptions): Promise<string> {
  const { config, context, miniTasks } = options;

  // Primero verificar si hay una mini tarea que responda
  const miniTaskResponse = checkMiniTasks(context.messageText, miniTasks);
  if (miniTaskResponse) {
    return miniTaskResponse;
  }

  // Si no hay mini tarea, usar OpenAI
  const apiKey = config.openai_api_key || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('No se ha configurado una API Key de OpenAI');
  }

  const openai = new OpenAI({ apiKey });

  // Construir el contexto del sistema
  const systemPrompt = buildSystemPrompt(config);

  // Construir el historial de conversación
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(context.conversationHistory || []),
    { role: 'user', content: context.messageText }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: config.openai_model,
      messages,
      temperature: config.temperature,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No se recibió respuesta de OpenAI');
    }

    return response.trim();
  } catch (error) {
    console.error('Error al generar respuesta con OpenAI:', error);
    throw new Error('Error al generar respuesta. Por favor intenta más tarde.');
  }
}

/**
 * Construye el prompt del sistema basado en la configuración
 */
function buildSystemPrompt(config: BotConfig): string {
  const { main_context, business_info } = config;

  let prompt = main_context;

  // Agregar información del negocio si está disponible
  if (business_info.name) {
    prompt += `\n\nInformación del negocio:\n`;
    prompt += `- Nombre: ${business_info.name}\n`;

    if (business_info.hours) {
      prompt += `- Horarios: ${business_info.hours}\n`;
    }

    if (business_info.address) {
      prompt += `- Dirección: ${business_info.address}\n`;
    }

    if (business_info.phone) {
      prompt += `- Teléfono: ${business_info.phone}\n`;
    }
  }

  prompt += `\n\nInstrucciones adicionales:
- Sé conciso y directo en tus respuestas
- Mantén un tono amigable y profesional
- Si no sabes algo, admítelo y ofrece alternativas
- Las respuestas deben ser apropiadas para WhatsApp (evita formato muy complejo)`;

  return prompt;
}

/**
 * Valida que la configuración de OpenAI sea correcta
 */
export function validateOpenAIConfig(config: BotConfig): { valid: boolean; error?: string } {
  if (!config.openai_api_key && !process.env.OPENAI_API_KEY) {
    return {
      valid: false,
      error: 'No hay API Key de OpenAI configurada'
    };
  }

  const validModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'];
  if (!validModels.includes(config.openai_model)) {
    return {
      valid: false,
      error: `Modelo inválido: ${config.openai_model}`
    };
  }

  if (config.temperature < 0 || config.temperature > 2) {
    return {
      valid: false,
      error: 'La temperatura debe estar entre 0 y 2'
    };
  }

  return { valid: true };
}
