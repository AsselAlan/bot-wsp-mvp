-- Migration: Remove mini_tasks system
-- Date: 2025-01-07
-- Description: Elimina completamente el sistema de mini-tareas ya que no tiene relevancia

-- 1. Eliminar índices relacionados con mini_tasks
DROP INDEX IF EXISTS public.idx_mini_tasks_bot_config_id;
DROP INDEX IF EXISTS public.idx_mini_tasks_trigger;

-- 2. Eliminar tabla mini_tasks
DROP TABLE IF EXISTS public.mini_tasks CASCADE;

-- 3. Eliminar columna was_automated de message_logs (ya no es relevante sin mini_tasks)
ALTER TABLE public.message_logs
DROP COLUMN IF EXISTS was_automated;
