-- Migración: Sistema de Plantillas de Negocio
-- Fecha: 2025-01-07
-- Descripción: Agrega tablas para plantillas de configuración por tipo de negocio

-- Tabla: business_templates
-- Almacena las plantillas predefinidas para diferentes tipos de negocio
CREATE TABLE IF NOT EXISTS public.business_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT '🏪',
  default_main_context TEXT NOT NULL,
  default_tone TEXT DEFAULT 'friendly' CHECK (default_tone IN ('formal', 'casual', 'friendly')),
  default_use_emojis TEXT DEFAULT 'moderate' CHECK (default_use_emojis IN ('never', 'moderate', 'frequent')),
  default_response_length TEXT DEFAULT 'medium' CHECK (default_response_length IN ('short', 'medium', 'long')),
  default_strict_mode BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para business_templates
CREATE INDEX IF NOT EXISTS idx_business_templates_slug ON public.business_templates(slug);
CREATE INDEX IF NOT EXISTS idx_business_templates_active ON public.business_templates(is_active) WHERE is_active = TRUE;

-- Trigger para updated_at
CREATE TRIGGER update_business_templates_updated_at
  BEFORE UPDATE ON public.business_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed Data: Plantilla Food Delivery
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
  default_strict_mode
) VALUES (
  'Servicio de Delivery de Comida',
  'food-delivery',
  'Restauración',
  'Ideal para negocios de delivery de comida, fast food, restaurantes con envío a domicilio. Incluye opciones para compartir menú, tomar pedidos, gestionar zonas de envío y métodos de pago.',
  '🍔',
  'Eres un asistente virtual especializado en atención al cliente para un servicio de delivery de comida. Tu objetivo principal es:

1. Ayudar a los clientes con consultas sobre el menú y productos disponibles
2. Facilitar información sobre pedidos, tiempos de entrega y zonas de cobertura
3. Resolver dudas sobre métodos de pago y promociones
4. Ser rápido, amigable y eficiente en tus respuestas

IMPORTANTE:
- Mantén un tono amigable y cercano
- Responde de forma concisa (ideal para WhatsApp)
- Si no tienes información específica sobre algo, admítelo honestamente
- Ayuda al cliente a completar su pedido de la mejor manera',
  'friendly',
  'frequent',
  'short',
  TRUE
);

-- Comentarios para documentación
COMMENT ON TABLE public.business_templates IS 'Plantillas predefinidas de configuración por tipo de negocio';
COMMENT ON COLUMN public.business_templates.slug IS 'Identificador único en formato slug (food-delivery, restaurant-reservations, etc.)';
COMMENT ON COLUMN public.business_templates.default_main_context IS 'Prompt base que define el comportamiento del bot para este tipo de negocio';
