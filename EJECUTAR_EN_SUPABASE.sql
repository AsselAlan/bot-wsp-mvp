-- ============================================
-- SCRIPT COMPLETO PARA CONFIGURAR SISTEMA DE ROLES
-- Ejecuta este SQL completo en el SQL Editor de Supabase
-- ============================================

-- PASO 1: Agregar columna role a users
-- ============================================
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client'
CHECK (role IN ('admin', 'client'));

-- PASO 2: Actualizar el primer usuario como admin
-- ============================================
UPDATE public.users
SET role = 'admin'
WHERE id IN (
  SELECT id FROM public.users
  ORDER BY created_at ASC
  LIMIT 1
);

-- PASO 3: Crear funciones helper
-- ============================================

-- Función: Verificar si un usuario es admin
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

-- Función: Obtener rol de usuario
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

-- PASO 4: Actualizar políticas RLS para permitir a admin ver todos los datos
-- ============================================

-- Bot configs
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

-- Orders (si existe la tabla)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own orders" ON public.orders';
    EXECUTE 'CREATE POLICY "Users can view own orders" ON public.orders
      FOR SELECT USING (
        auth.uid() = user_id OR public.is_admin(auth.uid())
      )';

    EXECUTE 'DROP POLICY IF EXISTS "Users can update own orders" ON public.orders';
    EXECUTE 'CREATE POLICY "Users can update own orders" ON public.orders
      FOR UPDATE USING (
        auth.uid() = user_id OR public.is_admin(auth.uid())
      )';
  END IF;
END $$;

-- Order config (si existe la tabla)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_config') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own order config" ON public.order_config';
    EXECUTE 'CREATE POLICY "Users can view own order config" ON public.order_config
      FOR SELECT USING (
        auth.uid() = user_id OR public.is_admin(auth.uid())
      )';

    EXECUTE 'DROP POLICY IF EXISTS "Users can update own order config" ON public.order_config';
    EXECUTE 'CREATE POLICY "Users can update own order config" ON public.order_config
      FOR UPDATE USING (
        auth.uid() = user_id OR public.is_admin(auth.uid())
      )';
  END IF;
END $$;

-- Message flows (si existe la tabla)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'message_flows') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Los usuarios pueden ver sus propios flujos" ON public.message_flows';
    EXECUTE 'CREATE POLICY "Los usuarios pueden ver sus propios flujos" ON public.message_flows
      FOR SELECT USING (
        auth.uid() = user_id OR public.is_admin(auth.uid())
      )';

    EXECUTE 'DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propios flujos" ON public.message_flows';
    EXECUTE 'CREATE POLICY "Los usuarios pueden actualizar sus propios flujos" ON public.message_flows
      FOR UPDATE USING (
        auth.uid() = user_id OR public.is_admin(auth.uid())
      )
      WITH CHECK (
        auth.uid() = user_id OR public.is_admin(auth.uid())
      )';
  END IF;
END $$;

-- Message logs
DROP POLICY IF EXISTS "Users can view own message logs" ON public.message_logs;
CREATE POLICY "Users can view own message logs" ON public.message_logs
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

-- Unanswered messages
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

-- Chat metrics
DROP POLICY IF EXISTS "Users can view own metrics" ON public.chat_metrics;
CREATE POLICY "Users can view own metrics" ON public.chat_metrics
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

-- WhatsApp connections
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

-- PASO 5: Política para que admin pueda ver todos los usuarios
-- ============================================
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
CREATE POLICY "Admin can view all users" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin(auth.uid())
  );

-- PASO 6: Actualizar la función de creación automática de usuarios
-- ============================================
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

-- PASO 7: Verificar el resultado
-- ============================================
SELECT
  id,
  email,
  role,
  created_at,
  CASE
    WHEN role = 'admin' THEN '✅ ADMIN'
    ELSE '👤 Cliente'
  END as rol_display
FROM public.users
ORDER BY created_at ASC;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- Si ves un usuario con "✅ ADMIN", todo está correcto
