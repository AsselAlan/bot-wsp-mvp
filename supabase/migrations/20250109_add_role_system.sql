-- Migración: Sistema de Roles (Admin/Client)
-- Fecha: 2025-01-09
-- Descripción: Agregar sistema de roles para diferenciar administradores de clientes

-- 1. Agregar columna de rol a la tabla users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client'
CHECK (role IN ('admin', 'client'));

-- 2. Actualizar el primer usuario existente como admin (si existe)
-- Esto asegura que el primer usuario del sistema sea admin
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Obtener el primer usuario creado
  SELECT id INTO first_user_id
  FROM public.users
  ORDER BY created_at ASC
  LIMIT 1;

  -- Si existe, hacerlo admin
  IF first_user_id IS NOT NULL THEN
    UPDATE public.users
    SET role = 'admin'
    WHERE id = first_user_id;
  END IF;
END $$;

-- 3. Modificar función de creación de usuario para asignar rol
-- Si es el primer usuario, será admin. Los demás serán client por defecto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  user_role TEXT;
BEGIN
  -- Contar usuarios existentes
  SELECT COUNT(*) INTO user_count FROM public.users;

  -- Si es el primer usuario, hacerlo admin
  IF user_count = 0 THEN
    user_role := 'admin';
  ELSE
    user_role := 'client';
  END IF;

  INSERT INTO public.users (id, email, created_at, role)
  VALUES (NEW.id, NEW.email, NOW(), user_role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función helper: Verificar si un usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id;

  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Función helper: Obtener rol de usuario
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id;

  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Actualizar políticas RLS para permitir a admin ver todos los datos

-- Política especial para admin en bot_configs
DROP POLICY IF EXISTS "Users can view own bot configs" ON public.bot_configs;
CREATE POLICY "Users can view own bot configs" ON public.bot_configs
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own bot configs" ON public.bot_configs;
CREATE POLICY "Users can update own bot configs" ON public.bot_configs
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

-- Política especial para admin en orders
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

-- Política especial para admin en order_config
DROP POLICY IF EXISTS "Users can view own order config" ON public.order_config;
CREATE POLICY "Users can view own order config" ON public.order_config
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own order config" ON public.order_config;
CREATE POLICY "Users can update own order config" ON public.order_config
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

-- Política especial para admin en message_flows
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios flujos" ON public.message_flows;
CREATE POLICY "Los usuarios pueden ver sus propios flujos" ON public.message_flows
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios flujos" ON public.message_flows;
CREATE POLICY "Los usuarios pueden actualizar sus propios flujos" ON public.message_flows
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

-- Política especial para admin en flow_conversation_states
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios estados de conversación" ON public.flow_conversation_states;
CREATE POLICY "Los usuarios pueden ver sus propios estados de conversación" ON public.flow_conversation_states
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

-- Política especial para admin en message_logs
DROP POLICY IF EXISTS "Users can view own message logs" ON public.message_logs;
CREATE POLICY "Users can view own message logs" ON public.message_logs
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

-- Política especial para admin en unanswered_messages
DROP POLICY IF EXISTS "Users can view own unanswered messages" ON public.unanswered_messages;
CREATE POLICY "Users can view own unanswered messages" ON public.unanswered_messages
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own unanswered messages" ON public.unanswered_messages;
CREATE POLICY "Users can update own unanswered messages" ON public.unanswered_messages
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

-- Política especial para admin en chat_metrics
DROP POLICY IF EXISTS "Users can view own metrics" ON public.chat_metrics;
CREATE POLICY "Users can view own metrics" ON public.chat_metrics
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

-- Política especial para admin en whatsapp_connections
DROP POLICY IF EXISTS "Users can view own connections" ON public.whatsapp_connections;
CREATE POLICY "Users can view own connections" ON public.whatsapp_connections
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own connections" ON public.whatsapp_connections;
CREATE POLICY "Users can update own connections" ON public.whatsapp_connections
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

-- 7. Política para que admin pueda ver todos los usuarios (para gestión de clientes)
CREATE POLICY "Admin can view all users" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin(auth.uid())
  );

-- Comentarios
COMMENT ON COLUMN public.users.role IS 'Rol del usuario: admin (administrador) o client (cliente)';
COMMENT ON FUNCTION public.is_admin IS 'Verifica si un usuario tiene rol de administrador';
COMMENT ON FUNCTION public.get_user_role IS 'Obtiene el rol de un usuario';
