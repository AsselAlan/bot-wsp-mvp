-- Script para crear manualmente el flujo predeterminado de "Tomar Pedido"
-- Ejecuta esto en el SQL Editor de Supabase

-- Paso 1: Verificar si ya existe
SELECT id, name, is_default
FROM message_flows
WHERE is_default = true;

-- Paso 2: Si no existe, obtener tu user_id
-- Reemplaza 'TU-EMAIL-AQUI' con tu email de usuario
SELECT id
FROM auth.users
WHERE email = 'TU-EMAIL-AQUI';

-- Paso 3: Crear el flujo con tu user_id
-- Reemplaza 'USER-UUID-AQUI' con el UUID del paso anterior
SELECT create_default_delivery_flow('USER-UUID-AQUI');

-- Paso 4: Verificar que se creó
SELECT id, name, is_default, is_active, steps
FROM message_flows
WHERE is_default = true;
