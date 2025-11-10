-- Script para verificar y activar sistema de pedidos
-- Ejecuta esto en tu consola de Supabase SQL Editor

-- 1. Verificar si existe la columna supports_orders
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'business_templates'
AND column_name = 'supports_orders';

-- 2. Si no existe, crearla
ALTER TABLE public.business_templates
ADD COLUMN IF NOT EXISTS supports_orders BOOLEAN DEFAULT FALSE;

-- 3. Activar soporte de pedidos para la plantilla de delivery
UPDATE public.business_templates
SET supports_orders = TRUE
WHERE slug = 'food-delivery';

-- 4. Verificar que se actualizó correctamente
SELECT id, name, slug, supports_orders
FROM public.business_templates
WHERE slug = 'food-delivery';

-- 5. Verificar qué plantilla tiene tu usuario seleccionada
-- (Reemplaza 'TU_USER_ID' con tu ID de usuario real o usa la query comentada abajo)
/*
SELECT
    bc.user_id,
    bc.selected_template_id,
    bt.name as template_name,
    bt.slug as template_slug,
    bt.supports_orders
FROM bot_configs bc
LEFT JOIN business_templates bt ON bt.id = bc.selected_template_id
WHERE bc.user_id = auth.uid(); -- Esto usa tu usuario actual autenticado
*/

-- 6. Si ya seleccionaste la plantilla pero no aparece el menú,
-- verifica que esté correctamente vinculada:
SELECT
    bc.user_id,
    bc.selected_template_id,
    bt.name as template_name,
    bt.slug as template_slug,
    bt.supports_orders
FROM bot_configs bc
LEFT JOIN business_templates bt ON bt.id = bc.selected_template_id
LIMIT 5;

-- RESULTADO ESPERADO:
-- La plantilla 'food-delivery' debe tener supports_orders = TRUE
-- Tu bot_config debe tener selected_template_id apuntando a esa plantilla
