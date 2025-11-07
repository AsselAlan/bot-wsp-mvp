-- Migración: Extender bot_configs para soportar plantillas
-- Fecha: 2025-01-07
-- Descripción: Agrega campos para vincular configuraciones con plantillas de negocio

-- Agregar columnas a bot_configs
ALTER TABLE public.bot_configs
ADD COLUMN IF NOT EXISTS selected_template_id UUID REFERENCES public.business_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS template_options JSONB DEFAULT '{}'::jsonb;

-- Índice para mejor performance en consultas por plantilla
CREATE INDEX IF NOT EXISTS idx_bot_configs_template_id ON public.bot_configs(selected_template_id);

-- Comentarios para documentación
COMMENT ON COLUMN public.bot_configs.selected_template_id IS 'Plantilla de negocio seleccionada por el usuario (nullable)';
COMMENT ON COLUMN public.bot_configs.template_options IS 'Valores de las opciones activadas de la plantilla (JSON key-value pairs)';

-- Ejemplo de estructura de template_options:
-- {
--   "enable_menu_link": true,
--   "menu_link_url": "https://mirestaurant.com/menu",
--   "enable_order_whatsapp": true,
--   "order_instructions": "Por favor indícame qué deseas ordenar...",
--   "payment_methods": ["Efectivo", "Transferencia bancaria", "Mercado Pago"]
-- }
