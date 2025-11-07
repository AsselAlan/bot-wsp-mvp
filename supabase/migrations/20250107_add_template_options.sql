-- Migración: Opciones Activables por Plantilla
-- Fecha: 2025-01-07
-- Descripción: Define las opciones configurables específicas para cada plantilla de negocio

-- Tabla: template_options
-- Define las opciones que pueden activarse/configurarse para cada plantilla
CREATE TABLE IF NOT EXISTS public.template_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.business_templates(id) ON DELETE CASCADE,
  option_key TEXT NOT NULL,
  option_label TEXT NOT NULL,
  option_description TEXT,
  category TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('boolean', 'text', 'textarea', 'url', 'file', 'select')),
  field_options JSONB,
  default_value TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, option_key)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_template_options_template_id ON public.template_options(template_id);
CREATE INDEX IF NOT EXISTS idx_template_options_category ON public.template_options(category);
CREATE INDEX IF NOT EXISTS idx_template_options_display_order ON public.template_options(display_order);

-- Seed Data: Opciones para Food Delivery
-- Obtener el ID de la plantilla Food Delivery
DO $$
DECLARE
  food_delivery_id UUID;
BEGIN
  SELECT id INTO food_delivery_id FROM public.business_templates WHERE slug = 'food-delivery';

  -- CATEGORÍA: MENÚ
  INSERT INTO public.template_options (template_id, option_key, option_label, option_description, category, field_type, display_order, is_required) VALUES
  (food_delivery_id, 'enable_menu_link', 'Ofrecer menú por link', 'Compartir un enlace directo al menú cuando los clientes lo soliciten', 'menu', 'boolean', 1, FALSE),
  (food_delivery_id, 'menu_link_url', 'URL del menú', 'Link donde se encuentra tu menú online', 'menu', 'url', 2, FALSE),
  (food_delivery_id, 'enable_menu_image', 'Ofrecer menú por imagen', 'Enviar una imagen del menú cuando lo soliciten', 'menu', 'boolean', 3, FALSE),
  (food_delivery_id, 'menu_image_url', 'URL de la imagen del menú', 'Link de la imagen del menú almacenada', 'menu', 'url', 4, FALSE),
  (food_delivery_id, 'enable_menu_document', 'Cargar menú en documento', 'Subir menú en PDF/TXT para que el bot pueda responder preguntas específicas', 'menu', 'boolean', 5, FALSE),
  (food_delivery_id, 'menu_text_content', 'Contenido del menú (texto)', 'Texto del menú para consultas del bot', 'menu', 'textarea', 6, FALSE);

  -- CATEGORÍA: PEDIDOS
  INSERT INTO public.template_options (template_id, option_key, option_label, option_description, category, field_type, display_order, is_required) VALUES
  (food_delivery_id, 'enable_order_whatsapp', 'Tomar pedidos por WhatsApp', 'El bot ayuda a recopilar información del pedido (items, cantidad, dirección)', 'pedidos', 'boolean', 10, FALSE),
  (food_delivery_id, 'order_instructions', 'Instrucciones para pedidos', 'Cómo debe el bot guiar al cliente en el proceso de pedido', 'pedidos', 'textarea', 11, FALSE),
  (food_delivery_id, 'enable_order_redirect', 'Redirigir a plataforma externa', 'Enviar al cliente a una web/app externa para completar el pedido', 'pedidos', 'boolean', 12, FALSE),
  (food_delivery_id, 'order_platform_url', 'URL de la plataforma de pedidos', 'Link a tu sistema de pedidos externo (ej: web propia, PedidosYa, etc.)', 'pedidos', 'url', 13, FALSE),
  (food_delivery_id, 'minimum_order', 'Monto mínimo de pedido', 'Monto mínimo requerido para realizar pedidos', 'pedidos', 'text', 14, FALSE);

  -- CATEGORÍA: DELIVERY
  INSERT INTO public.template_options (template_id, option_key, option_label, option_description, category, field_type, display_order, is_required) VALUES
  (food_delivery_id, 'enable_delivery_zones', 'Configurar zonas de cobertura', 'Definir las zonas donde realizan envíos y sus costos', 'delivery', 'boolean', 20, FALSE),
  (food_delivery_id, 'delivery_zones_info', 'Información de zonas', 'Detalle de zonas de cobertura y costos de envío', 'delivery', 'textarea', 21, FALSE),
  (food_delivery_id, 'enable_delivery_time', 'Informar tiempos de entrega', 'Compartir tiempos estimados de delivery', 'delivery', 'boolean', 22, FALSE),
  (food_delivery_id, 'delivery_time_info', 'Tiempos de entrega', 'Tiempo estimado de entrega (ej: "30-45 minutos")', 'delivery', 'text', 23, FALSE),
  (food_delivery_id, 'delivery_cost', 'Costo de delivery', 'Costo del envío o si es gratis', 'delivery', 'text', 24, FALSE);

  -- CATEGORÍA: PAGOS
  INSERT INTO public.template_options (template_id, option_key, option_label, option_description, category, field_type, field_options, display_order, is_required) VALUES
  (food_delivery_id, 'enable_payment_methods', 'Informar métodos de pago', 'Especificar qué métodos de pago aceptan', 'pagos', 'boolean', NULL, 30, FALSE),
  (food_delivery_id, 'payment_methods', 'Métodos de pago aceptados', 'Selecciona los métodos de pago que aceptas', 'pagos', 'select',
   '["Efectivo", "Transferencia bancaria", "Mercado Pago", "Tarjeta de débito", "Tarjeta de crédito", "Otro"]'::jsonb, 31, FALSE),
  (food_delivery_id, 'enable_payment_link', 'Compartir link de pago', 'Enviar enlace para pago online', 'pagos', 'boolean', NULL, 32, FALSE),
  (food_delivery_id, 'payment_link_url', 'URL de pago', 'Link para realizar pagos online (Mercado Pago, web propia, etc.)', 'pagos', 'url', NULL, 33, FALSE);

  -- CATEGORÍA: INFORMACIÓN GENERAL
  INSERT INTO public.template_options (template_id, option_key, option_label, option_description, category, field_type, display_order, is_required) VALUES
  (food_delivery_id, 'enable_business_hours', 'Informar horarios de atención', 'Compartir horarios de atención cuando pregunten', 'general', 'boolean', 40, FALSE),
  (food_delivery_id, 'enable_promotions', 'Comunicar promociones activas', 'Informar sobre ofertas o promociones vigentes', 'general', 'boolean', 41, FALSE),
  (food_delivery_id, 'promotions_text', 'Texto de promociones', 'Detalle de las promociones activas', 'general', 'textarea', 42, FALSE),
  (food_delivery_id, 'enable_allergen_info', 'Información sobre alérgenos', 'Proporcionar información sobre ingredientes y alérgenos cuando pregunten', 'general', 'boolean', 43, FALSE),
  (food_delivery_id, 'allergen_info_text', 'Información de alérgenos', 'Detalles sobre ingredientes, opciones sin gluten, veganas, etc.', 'general', 'textarea', 44, FALSE);

END $$;

-- Comentarios para documentación
COMMENT ON TABLE public.template_options IS 'Opciones configurables específicas de cada plantilla de negocio';
COMMENT ON COLUMN public.template_options.option_key IS 'Clave única de la opción (enable_menu_link, menu_link_url, etc.)';
COMMENT ON COLUMN public.template_options.category IS 'Categoría para agrupar opciones (menu, pedidos, delivery, pagos, general)';
COMMENT ON COLUMN public.template_options.field_type IS 'Tipo de campo UI (boolean para checkbox, text/textarea/url para inputs, file para uploads, select para dropdowns)';
COMMENT ON COLUMN public.template_options.field_options IS 'Opciones disponibles para campos tipo select (array JSON)';
COMMENT ON COLUMN public.template_options.display_order IS 'Orden de visualización en el formulario';
