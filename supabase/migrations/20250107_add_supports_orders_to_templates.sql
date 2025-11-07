-- Migration: Add supports_orders field to business_templates
-- Date: 2025-01-07
-- Description: Agrega campo para indicar qué plantillas soportan sistema de pedidos

-- Agregar columna supports_orders a business_templates
ALTER TABLE public.business_templates
ADD COLUMN IF NOT EXISTS supports_orders BOOLEAN DEFAULT FALSE;

-- Actualizar plantilla de Food Delivery para soportar pedidos
UPDATE public.business_templates
SET supports_orders = TRUE
WHERE slug = 'food-delivery';

-- Comentario para documentación
COMMENT ON COLUMN public.business_templates.supports_orders IS 'Indica si esta plantilla incluye funcionalidad de toma de pedidos';
