-- Migración: Agregar tabla de mensajes sin responder y campos de notificaciones
-- Fecha: 2024-11-07
-- Descripción: Fase 5B - Sistema de mensajes sin responder

-- 1. Agregar campos de notificaciones a bot_configs
ALTER TABLE public.bot_configs
ADD COLUMN IF NOT EXISTS notification_number TEXT,
ADD COLUMN IF NOT EXISTS enable_unanswered_notifications BOOLEAN DEFAULT FALSE;

-- 2. Crear tabla unanswered_messages
CREATE TABLE IF NOT EXISTS public.unanswered_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL,
  sender_number TEXT NOT NULL,
  message_text TEXT NOT NULL,
  attempted_response TEXT,
  reason TEXT CHECK (reason IN ('out_of_context', 'no_match', 'api_error', 'paused')),
  is_reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 3. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_unanswered_messages_user_id
  ON public.unanswered_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_unanswered_messages_is_reviewed
  ON public.unanswered_messages(is_reviewed)
  WHERE is_reviewed = FALSE;

CREATE INDEX IF NOT EXISTS idx_unanswered_messages_created_at
  ON public.unanswered_messages(created_at DESC);

-- 4. Habilitar Row Level Security
ALTER TABLE public.unanswered_messages ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para unanswered_messages
CREATE POLICY "Users can view own unanswered messages"
  ON public.unanswered_messages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unanswered messages"
  ON public.unanswered_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own unanswered messages"
  ON public.unanswered_messages
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own unanswered messages"
  ON public.unanswered_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Comentarios para documentación
COMMENT ON TABLE public.unanswered_messages IS 'Mensajes que el bot no pudo responder';
COMMENT ON COLUMN public.bot_configs.notification_number IS 'Número de WhatsApp para recibir notificaciones';
COMMENT ON COLUMN public.bot_configs.enable_unanswered_notifications IS 'Activar/desactivar notificaciones de mensajes sin responder';
