-- Script para actualizar el usuario existente como admin
-- Ejecuta este SQL en el SQL Editor de Supabase

-- 1. Primero, agregar la columna role si no existe (de la migración)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client'
CHECK (role IN ('admin', 'client'));

-- 2. Actualizar el primer usuario (o todos los usuarios existentes) como admin
UPDATE public.users
SET role = 'admin'
WHERE id IN (
  SELECT id FROM public.users
  ORDER BY created_at ASC
  LIMIT 1
);

-- 3. Verificar el cambio
SELECT id, email, role, created_at
FROM public.users
ORDER BY created_at ASC;
