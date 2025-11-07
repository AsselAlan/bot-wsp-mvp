import { BotConfig, BusinessTemplate } from '@/types';

/**
 * Construye instrucciones adicionales para el prompt basadas en las opciones de template activadas
 */
export function buildTemplateInstructions(templateOptions: Record<string, any>): string {
  const instructions: string[] = [];

  // CATEGORÍA: MENÚ
  if (templateOptions.enable_menu_link && templateOptions.menu_link_url) {
    instructions.push(
      `Cuando los clientes pregunten por el menú, comparte este enlace: ${templateOptions.menu_link_url}`
    );
  }

  if (templateOptions.enable_menu_image && templateOptions.menu_image_url) {
    instructions.push(
      `Puedes mencionar que el menú está disponible como imagen en: ${templateOptions.menu_image_url}`
    );
  }

  if (templateOptions.enable_menu_document && templateOptions.menu_text_content) {
    instructions.push(
      `Información del menú disponible:\n${templateOptions.menu_text_content}`
    );
  }

  // CATEGORÍA: PEDIDOS
  if (templateOptions.enable_order_whatsapp && templateOptions.order_instructions) {
    instructions.push(
      `Para tomar pedidos por WhatsApp:\n${templateOptions.order_instructions}`
    );
  }

  if (templateOptions.enable_order_redirect && templateOptions.order_platform_url) {
    instructions.push(
      `Para realizar pedidos, redirige a los clientes a: ${templateOptions.order_platform_url}`
    );
  }

  if (templateOptions.minimum_order) {
    instructions.push(
      `El monto mínimo de pedido es: ${templateOptions.minimum_order}`
    );
  }

  // CATEGORÍA: DELIVERY
  if (templateOptions.enable_delivery_zones && templateOptions.delivery_zones_info) {
    instructions.push(
      `Zonas de delivery y costos:\n${templateOptions.delivery_zones_info}`
    );
  }

  if (templateOptions.enable_delivery_time && templateOptions.delivery_time_info) {
    instructions.push(
      `Tiempo estimado de entrega: ${templateOptions.delivery_time_info}`
    );
  }

  if (templateOptions.delivery_cost) {
    instructions.push(
      `Costo de delivery: ${templateOptions.delivery_cost}`
    );
  }

  // CATEGORÍA: PAGOS
  if (templateOptions.enable_payment_methods && templateOptions.payment_methods) {
    const methods = Array.isArray(templateOptions.payment_methods)
      ? templateOptions.payment_methods.join(', ')
      : templateOptions.payment_methods;
    instructions.push(
      `Métodos de pago aceptados: ${methods}`
    );
  }

  if (templateOptions.enable_payment_link && templateOptions.payment_link_url) {
    instructions.push(
      `Para pagos online, comparte este enlace: ${templateOptions.payment_link_url}`
    );
  }

  // CATEGORÍA: INFORMACIÓN GENERAL
  if (templateOptions.enable_business_hours) {
    instructions.push(
      `Informa los horarios de atención cuando te lo pregunten (usa la información de business_info.hours)`
    );
  }

  if (templateOptions.enable_promotions && templateOptions.promotions_text) {
    instructions.push(
      `Promociones actuales:\n${templateOptions.promotions_text}`
    );
  }

  if (templateOptions.enable_allergen_info && templateOptions.allergen_info_text) {
    instructions.push(
      `Información sobre alérgenos e ingredientes:\n${templateOptions.allergen_info_text}`
    );
  }

  // Retornar instrucciones concatenadas
  if (instructions.length === 0) {
    return '';
  }

  return `\n\nINFORMACIÓN Y CONFIGURACIONES ADICIONALES:\n${instructions.join('\n\n')}`;
}

/**
 * Aplica los valores de una plantilla a la configuración del bot
 */
export function applyTemplateToConfig(
  template: any,
  currentConfig: Partial<BotConfig> = {}
): Partial<BotConfig> {
  return {
    ...currentConfig,
    main_context: template.default_main_context,
    tone: template.default_tone,
    use_emojis: template.default_use_emojis,
    response_length: template.default_response_length,
    strict_mode: template.default_strict_mode,
    selected_template_id: template.id,
  };
}

/**
 * Valida las opciones de template según sus definiciones
 */
export function validateTemplateOptions(
  options: Record<string, any>,
  templateOptions: any[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  templateOptions.forEach((optionDef) => {
    const value = options[optionDef.option_key];

    // Validar campos requeridos
    if (optionDef.is_required && !value) {
      errors.push(`${optionDef.option_label} es requerido`);
    }

    // Validar tipo de campo
    if (value !== undefined && value !== null) {
      switch (optionDef.field_type) {
        case 'url':
          try {
            new URL(value);
          } catch {
            errors.push(`${optionDef.option_label} debe ser una URL válida`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${optionDef.option_label} debe ser verdadero o falso`);
          }
          break;
        case 'select':
          if (optionDef.field_options && !optionDef.field_options.includes(value)) {
            errors.push(`${optionDef.option_label} tiene un valor inválido`);
          }
          break;
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Obtiene un objeto con valores por defecto para las opciones de una plantilla
 */
export function getDefaultTemplateOptions(templateOptions: any[]): Record<string, any> {
  const defaults: Record<string, any> = {};

  templateOptions.forEach((option) => {
    if (option.default_value) {
      defaults[option.option_key] = option.default_value;
    } else {
      // Valores por defecto según tipo
      switch (option.field_type) {
        case 'boolean':
          defaults[option.option_key] = false;
          break;
        case 'text':
        case 'textarea':
        case 'url':
          defaults[option.option_key] = '';
          break;
        case 'select':
          defaults[option.option_key] = option.field_options?.[0] || '';
          break;
        default:
          defaults[option.option_key] = null;
      }
    }
  });

  return defaults;
}

/**
 * Genera el contexto completo del bot automáticamente
 * Combina: contexto base de plantilla + datos básicos + opciones activadas
 */
export function generateFullContext(
  template: BusinessTemplate,
  templateOptions: Record<string, any>,
  customInstructions?: string
): string {
  let context = template.default_main_context;

  // 1. AGREGAR INFORMACIÓN BÁSICA DEL NEGOCIO
  const basicInfoParts: string[] = [];

  if (templateOptions.business_name) {
    basicInfoParts.push(`Nombre del negocio: ${templateOptions.business_name}`);
  }

  if (templateOptions.business_hours) {
    basicInfoParts.push(`Horarios de atención: ${templateOptions.business_hours}`);
  }

  if (templateOptions.business_address) {
    basicInfoParts.push(`Dirección: ${templateOptions.business_address}`);
  }

  if (templateOptions.business_phone) {
    basicInfoParts.push(`Teléfono de contacto: ${templateOptions.business_phone}`);
  }

  if (basicInfoParts.length > 0) {
    context += `\n\n${basicInfoParts.join('\n')}`;
  }

  // 2. AGREGAR INSTRUCCIONES DE OPCIONES ACTIVADAS
  const templateInstructions = buildTemplateInstructions(templateOptions);
  if (templateInstructions) {
    context += templateInstructions;
  }

  // 3. AGREGAR REGLAS DE COMPORTAMIENTO (automático según plantilla)
  context += `\n\nREGLAS DE COMPORTAMIENTO:`;
  context += `\n- Tono: ${getToneDescription(template.default_tone)}`;
  context += `\n- Longitud de respuesta: ${getLengthDescription(template.default_response_length)}`;
  context += `\n- Emojis: ${getEmojiDescription(template.default_use_emojis)}`;

  if (template.default_strict_mode) {
    context += `\n- MODO ESTRICTO: Nunca inventes información que no esté explícitamente en este contexto. Si no tienes un dato, admítelo honestamente.`;
  }

  // 4. AGREGAR INSTRUCCIONES PERSONALIZADAS (opcional)
  if (customInstructions && customInstructions.trim()) {
    context += `\n\nINSTRUCCIONES ADICIONALES PERSONALIZADAS:\n${customInstructions}`;
  }

  return context.trim();
}

/**
 * Helper: Describe el tono en lenguaje natural
 */
function getToneDescription(tone: string): string {
  const descriptions: Record<string, string> = {
    formal: 'Formal y profesional, usando lenguaje técnico cuando sea apropiado',
    casual: 'Casual y relajado, como hablando con un amigo',
    friendly: 'Amigable y cálido, profesional pero accesible',
  };
  return descriptions[tone] || descriptions.friendly;
}

/**
 * Helper: Describe la longitud de respuesta
 */
function getLengthDescription(length: string): string {
  const descriptions: Record<string, string> = {
    short: 'Muy breve y concisa (1-2 oraciones máximo)',
    medium: 'Moderada e informativa pero concisa (2-4 oraciones)',
    long: 'Detallada y explicativa cuando sea necesario',
  };
  return descriptions[length] || descriptions.medium;
}

/**
 * Helper: Describe el uso de emojis
 */
function getEmojiDescription(emojiUsage: string): string {
  const descriptions: Record<string, string> = {
    never: 'NUNCA uses emojis en tus respuestas',
    moderate: 'Usa emojis ocasionalmente para hacer tus mensajes más amigables (máximo 1-2 por mensaje)',
    frequent: 'Usa emojis con frecuencia para hacer tus mensajes más expresivos y amigables',
  };
  return descriptions[emojiUsage] || descriptions.moderate;
}
