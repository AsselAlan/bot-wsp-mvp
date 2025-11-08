-- Crear tabla para flujos de mensajes conversacionales
CREATE TABLE IF NOT EXISTS message_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Información básica del flujo
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '💬',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Configuración de activación
  activation_type VARCHAR(20) NOT NULL CHECK (activation_type IN ('keywords', 'ai')),
  activation_keywords TEXT[], -- Array de palabras clave para activación
  activation_prompt TEXT, -- Prompt para IA si usa activation_type = 'ai'

  -- Pasos del flujo (array de objetos JSON)
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Estructura de steps: [
  --   {
  --     "order": 1,
  --     "context": "Contexto principal para este paso",
  --     "expected_trigger": "Mensaje esperado del usuario para activar este paso",
  --     "bot_response": "Respuesta que dará el bot en este paso",
  --     "validation_type": "any|keywords|ai|none",
  --     "validation_keywords": ["palabra1", "palabra2"]
  --   }
  -- ]

  -- Acción final al completar el flujo
  final_action JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Estructura de final_action: {
  --   "type": "create_order|send_notification|save_info|webhook",
  --   "config": {
  --     // Configuración específica según el tipo
  --   }
  -- }

  -- Configuración adicional
  timeout_minutes INTEGER DEFAULT 30, -- Tiempo máximo para completar el flujo
  allow_restart BOOLEAN DEFAULT true,
  error_message TEXT DEFAULT 'Lo siento, hubo un error. ¿Deseas empezar de nuevo?',

  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_message_flows_user_id ON message_flows(user_id);
CREATE INDEX idx_message_flows_active ON message_flows(is_active) WHERE is_active = true;
CREATE INDEX idx_message_flows_default ON message_flows(is_default) WHERE is_default = true;

-- Crear tabla para rastrear el estado de conversaciones en flujos activos
CREATE TABLE IF NOT EXISTS flow_conversation_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES message_flows(id) ON DELETE CASCADE,

  -- Identificación del chat/usuario
  chat_id VARCHAR(255) NOT NULL,
  customer_whatsapp_id VARCHAR(255) NOT NULL,

  -- Estado del flujo
  current_step INTEGER NOT NULL DEFAULT 1,
  is_completed BOOLEAN DEFAULT false,
  is_cancelled BOOLEAN DEFAULT false,

  -- Datos recopilados durante el flujo
  collected_data JSONB DEFAULT '{}'::jsonb,
  -- Estructura: {
  --   "step_1": {"user_message": "...", "bot_response": "..."},
  --   "step_2": {"user_message": "...", "bot_response": "..."},
  --   "extracted_info": { ... }
  -- }

  -- Control de tiempo
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para estados de conversación
CREATE INDEX idx_flow_states_user_id ON flow_conversation_states(user_id);
CREATE INDEX idx_flow_states_flow_id ON flow_conversation_states(flow_id);
CREATE INDEX idx_flow_states_chat_id ON flow_conversation_states(chat_id);
CREATE INDEX idx_flow_states_active ON flow_conversation_states(is_completed, is_cancelled, expires_at)
  WHERE is_completed = false AND is_cancelled = false;

-- Índice compuesto para búsquedas comunes
CREATE UNIQUE INDEX idx_flow_states_active_conversation
  ON flow_conversation_states(user_id, chat_id)
  WHERE is_completed = false AND is_cancelled = false;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_message_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_flow_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers
CREATE TRIGGER trigger_update_message_flows_updated_at
  BEFORE UPDATE ON message_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_message_flows_updated_at();

CREATE TRIGGER trigger_update_flow_states_updated_at
  BEFORE UPDATE ON flow_conversation_states
  FOR EACH ROW
  EXECUTE FUNCTION update_flow_states_updated_at();

-- Políticas RLS (Row Level Security)
ALTER TABLE message_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_conversation_states ENABLE ROW LEVEL SECURITY;

-- Políticas para message_flows
CREATE POLICY "Los usuarios pueden ver sus propios flujos"
  ON message_flows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propios flujos"
  ON message_flows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios flujos"
  ON message_flows FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios flujos"
  ON message_flows FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para flow_conversation_states
CREATE POLICY "Los usuarios pueden ver sus propios estados de conversación"
  ON flow_conversation_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propios estados de conversación"
  ON flow_conversation_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios estados de conversación"
  ON flow_conversation_states FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios estados de conversación"
  ON flow_conversation_states FOR DELETE
  USING (auth.uid() = user_id);

-- Función para limpiar estados expirados automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_flow_states()
RETURNS void AS $$
BEGIN
  UPDATE flow_conversation_states
  SET is_cancelled = true,
      updated_at = NOW()
  WHERE expires_at < NOW()
    AND is_completed = false
    AND is_cancelled = false;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE message_flows IS 'Flujos de mensajes conversacionales configurables por el usuario';
COMMENT ON TABLE flow_conversation_states IS 'Estados activos de conversaciones siguiendo un flujo de mensajes';
COMMENT ON COLUMN message_flows.activation_type IS 'Tipo de activación: keywords (palabras clave) o ai (inteligencia artificial)';
COMMENT ON COLUMN message_flows.steps IS 'Array de pasos del flujo con contexto, triggers y respuestas';
COMMENT ON COLUMN message_flows.final_action IS 'Acción a ejecutar al completar el flujo (crear pedido, notificar, etc)';
COMMENT ON COLUMN flow_conversation_states.collected_data IS 'Datos recopilados durante la ejecución del flujo';
