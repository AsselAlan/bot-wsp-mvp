-- Migración: Agregar campos de configuración de prompt
-- Fecha: 2025-01-07
-- Descripción: Agrega campos para personalizar el comportamiento del bot (tono, emojis, modo estricto, etc.)

-- Agregar nuevos campos a bot_configs
ALTER TABLE public.bot_configs
ADD COLUMN IF NOT EXISTS tone TEXT DEFAULT 'friendly' CHECK (tone IN ('formal', 'casual', 'friendly')),
ADD COLUMN IF NOT EXISTS use_emojis TEXT DEFAULT 'moderate' CHECK (use_emojis IN ('never', 'moderate', 'frequent')),
ADD COLUMN IF NOT EXISTS strict_mode BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS response_length TEXT DEFAULT 'medium' CHECK (response_length IN ('short', 'medium', 'long')),
ADD COLUMN IF NOT EXISTS custom_instructions TEXT DEFAULT '';

-- Comentarios para documentación
COMMENT ON COLUMN public.bot_configs.tone IS 'Tono de las respuestas del bot: formal, casual o amigable';
COMMENT ON COLUMN public.bot_configs.use_emojis IS 'Frecuencia de uso de emojis: never, moderate, frequent';
COMMENT ON COLUMN public.bot_configs.strict_mode IS 'Si es true, el bot no inventará información que no esté en el contexto';
COMMENT ON COLUMN public.bot_configs.response_length IS 'Longitud preferida de las respuestas: short, medium, long';
COMMENT ON COLUMN public.bot_configs.custom_instructions IS 'Instrucciones adicionales personalizadas para el bot';
