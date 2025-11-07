-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla: users (extensión de auth.users de Supabase)
-- Nota: Supabase Auth ya maneja la tabla auth.users
-- Esta tabla es para información adicional del usuario
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise'))
);

-- Tabla: whatsapp_connections
CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phone_number TEXT,
  is_connected BOOLEAN DEFAULT FALSE,
  session_data JSONB,
  last_connected TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabla: bot_configs
CREATE TABLE IF NOT EXISTS public.bot_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  main_context TEXT NOT NULL DEFAULT 'Eres un asistente virtual amable y servicial.',
  business_info JSONB DEFAULT '{"name": "", "hours": "", "address": "", "phone": ""}',
  openai_model TEXT DEFAULT 'gpt-3.5-turbo' CHECK (openai_model IN ('gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo')),
  openai_api_key TEXT,
  temperature DECIMAL(2, 1) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabla: mini_tasks
CREATE TABLE IF NOT EXISTS public.mini_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bot_config_id UUID NOT NULL REFERENCES public.bot_configs(id) ON DELETE CASCADE,
  trigger_keyword TEXT NOT NULL,
  response_text TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: chat_metrics
CREATE TABLE IF NOT EXISTS public.chat_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  total_chats INTEGER DEFAULT 0,
  daily_chats INTEGER DEFAULT 0,
  bot_responses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Tabla: message_logs
CREATE TABLE IF NOT EXISTS public.message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL,
  sender_number TEXT NOT NULL,
  message_text TEXT NOT NULL,
  bot_response TEXT,
  was_automated BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_user_id ON public.whatsapp_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_configs_user_id ON public.bot_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_mini_tasks_bot_config_id ON public.mini_tasks(bot_config_id);
CREATE INDEX IF NOT EXISTS idx_mini_tasks_trigger ON public.mini_tasks(trigger_keyword) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_chat_metrics_user_date ON public.chat_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_message_logs_user_id ON public.message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_timestamp ON public.message_logs(timestamp DESC);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para bot_configs
CREATE TRIGGER update_bot_configs_updated_at
  BEFORE UPDATE ON public.bot_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mini_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para whatsapp_connections
CREATE POLICY "Users can view own connections" ON public.whatsapp_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections" ON public.whatsapp_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" ON public.whatsapp_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections" ON public.whatsapp_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para bot_configs
CREATE POLICY "Users can view own bot configs" ON public.bot_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bot configs" ON public.bot_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bot configs" ON public.bot_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bot configs" ON public.bot_configs
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para mini_tasks
CREATE POLICY "Users can view own mini tasks" ON public.mini_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bot_configs
      WHERE bot_configs.id = mini_tasks.bot_config_id
      AND bot_configs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own mini tasks" ON public.mini_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bot_configs
      WHERE bot_configs.id = mini_tasks.bot_config_id
      AND bot_configs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own mini tasks" ON public.mini_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.bot_configs
      WHERE bot_configs.id = mini_tasks.bot_config_id
      AND bot_configs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own mini tasks" ON public.mini_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.bot_configs
      WHERE bot_configs.id = mini_tasks.bot_config_id
      AND bot_configs.user_id = auth.uid()
    )
  );

-- Políticas para chat_metrics
CREATE POLICY "Users can view own metrics" ON public.chat_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics" ON public.chat_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics" ON public.chat_metrics
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para message_logs
CREATE POLICY "Users can view own message logs" ON public.message_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own message logs" ON public.message_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Función para crear usuario en public.users automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear usuario automáticamente cuando se registra
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Función para incrementar métricas diarias
CREATE OR REPLACE FUNCTION public.increment_chat_metrics(
  p_user_id UUID,
  p_is_bot_response BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.chat_metrics (user_id, date, total_chats, daily_chats, bot_responses)
  VALUES (
    p_user_id,
    CURRENT_DATE,
    1,
    1,
    CASE WHEN p_is_bot_response THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_chats = chat_metrics.total_chats + 1,
    daily_chats = chat_metrics.daily_chats + 1,
    bot_responses = chat_metrics.bot_responses + CASE WHEN p_is_bot_response THEN 1 ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios para documentación
COMMENT ON TABLE public.users IS 'Información adicional de usuarios registrados';
COMMENT ON TABLE public.whatsapp_connections IS 'Conexiones de WhatsApp por usuario';
COMMENT ON TABLE public.bot_configs IS 'Configuración del bot de WhatsApp';
COMMENT ON TABLE public.mini_tasks IS 'Tareas automáticas basadas en palabras clave';
COMMENT ON TABLE public.chat_metrics IS 'Métricas diarias de chats';
COMMENT ON TABLE public.message_logs IS 'Registro de mensajes y respuestas del bot';
