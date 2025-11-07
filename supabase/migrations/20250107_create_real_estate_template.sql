-- Migration: Create Real Estate (Inmobiliaria) Template
-- Date: 2025-01-07
-- Description: Crea plantilla para inmobiliarias con opciones específicas del rubro

-- 1. Crear plantilla de Inmobiliaria
INSERT INTO public.business_templates (
  name,
  slug,
  category,
  description,
  icon,
  default_main_context,
  default_tone,
  default_use_emojis,
  default_response_length,
  default_strict_mode,
  supports_orders
) VALUES (
  'Inmobiliaria',
  'real-estate',
  'Servicios',
  'Ideal para inmobiliarias, corredores de propiedades, agencias de alquiler y venta. Incluye opciones para gestionar propiedades, agendar visitas y compartir catálogos.',
  '🏢',
  'Eres un asistente virtual especializado en atención al cliente para una inmobiliaria. Tu objetivo principal es:

1. Ayudar a los clientes con consultas sobre propiedades disponibles
2. Facilitar información sobre características, precios y ubicaciones
3. Coordinar visitas y agendamientos
4. Resolver dudas sobre procesos de alquiler o compra
5. Ser profesional, confiable y servicial

IMPORTANTE:
- Mantén un tono profesional pero amigable
- Proporciona información precisa sobre las propiedades
- Si no tienes datos específicos sobre una propiedad, admítelo honestamente
- Ayuda al cliente a encontrar la propiedad ideal para sus necesidades',
  'friendly',
  'moderate',
  'medium',
  TRUE,
  FALSE
);

-- 2. Obtener el ID de la plantilla recién creada
DO $$
DECLARE
  real_estate_template_id UUID;
BEGIN
  -- Obtener ID de la plantilla
  SELECT id INTO real_estate_template_id
  FROM public.business_templates
  WHERE slug = 'real-estate';

  -- 3. Insertar opciones específicas de Inmobiliaria

  -- CATEGORÍA: propiedades
  INSERT INTO public.template_options (
    template_id, option_key, option_label, option_description,
    category, field_type, field_options, default_value, is_required, display_order
  ) VALUES
  (real_estate_template_id, 'property_types', 'Tipos de propiedad que manejan', 'Selecciona los tipos de propiedades que tu inmobiliaria ofrece',
    'propiedades', 'select', '["Casa", "Departamento", "Local comercial", "Oficina", "Terreno", "Cochera", "Quinta", "Campo"]'::jsonb, NULL, FALSE, 10),

  (real_estate_template_id, 'operation_types', 'Tipo de operaciones', 'Qué servicios ofrece tu inmobiliaria',
    'propiedades', 'select', '["Venta", "Alquiler", "Alquiler temporal", "Tasaciones"]'::jsonb, NULL, FALSE, 11),

  (real_estate_template_id, 'property_zones', 'Zonas donde operan', 'Lista las zonas, barrios o ciudades donde tienen propiedades (ej: Palermo, Belgrano, Caballito)',
    'propiedades', 'textarea', NULL, NULL, FALSE, 12),

  (real_estate_template_id, 'enable_catalog_link', 'Compartir link al catálogo de propiedades', 'Activar para compartir enlace al catálogo online',
    'propiedades', 'boolean', NULL, 'false', FALSE, 13),

  (real_estate_template_id, 'catalog_url', 'URL del catálogo de propiedades', 'Link directo al catálogo o portal inmobiliario',
    'propiedades', 'url', NULL, NULL, FALSE, 14),

  -- CATEGORÍA: visitas
  (real_estate_template_id, 'enable_scheduling', 'Permitir agendar visitas por WhatsApp', 'Los clientes pueden solicitar visitas directamente',
    'visitas', 'boolean', NULL, 'true', FALSE, 20),

  (real_estate_template_id, 'scheduling_info', 'Información sobre visitas', 'Instrucciones sobre cómo se coordinan las visitas (ej: "Las visitas se coordinan de Lun a Vie de 10 a 18hs. Necesitamos al menos 24hs de anticipación")',
    'visitas', 'textarea', NULL, NULL, FALSE, 21),

  (real_estate_template_id, 'visit_requirements', 'Requisitos para visitar', 'Qué necesita el cliente para agendar (ej: DNI, pre-aprobación de crédito, etc.)',
    'visitas', 'textarea', NULL, NULL, FALSE, 22),

  -- CATEGORÍA: servicios
  (real_estate_template_id, 'additional_services', 'Servicios adicionales', 'Otros servicios que ofrece la inmobiliaria (ej: asesoramiento legal, gestión de créditos, seguros, etc.)',
    'servicios', 'textarea', NULL, NULL, FALSE, 30),

  (real_estate_template_id, 'commission_info', 'Información sobre comisiones', 'Detalles sobre honorarios y comisiones (opcional)',
    'servicios', 'textarea', NULL, NULL, FALSE, 31),

  -- CATEGORÍA: general
  (real_estate_template_id, 'whatsapp_only', 'Solo atención por WhatsApp', 'Indica si la atención es exclusivamente por WhatsApp o también tienen oficina física',
    'general', 'boolean', NULL, 'false', FALSE, 40),

  (real_estate_template_id, 'response_time', 'Tiempo de respuesta', 'Cuánto tiempo tardan en responder consultas (ej: "Respondemos consultas en menos de 2 horas en horario laboral")',
    'general', 'text', NULL, NULL, FALSE, 41);

END $$;

-- Comentarios para documentación
COMMENT ON COLUMN public.business_templates.supports_orders IS 'Las inmobiliarias no utilizan sistema de pedidos, solo gestión de consultas y visitas';
