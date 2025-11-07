-- Migration: Add basic business info options to all templates
-- Date: 2025-01-07
-- Description: Agrega opciones obligatorias de información básica (nombre, horarios, dirección, teléfono) a todas las plantillas

-- Función helper para insertar opciones básicas en una plantilla
DO $$
DECLARE
  template_record RECORD;
BEGIN
  -- Iterar sobre todas las plantillas activas
  FOR template_record IN
    SELECT id FROM public.business_templates WHERE is_active = TRUE
  LOOP
    -- Insertar las 4 opciones básicas para cada plantilla

    -- 1. Nombre del negocio
    INSERT INTO public.template_options (
      template_id,
      option_key,
      option_label,
      option_description,
      category,
      field_type,
      default_value,
      is_required,
      display_order
    ) VALUES (
      template_record.id,
      'business_name',
      'Nombre del negocio',
      'Nombre comercial de tu negocio',
      'basic',
      'text',
      NULL,
      TRUE,
      0
    )
    ON CONFLICT (template_id, option_key) DO NOTHING;

    -- 2. Horarios de atención
    INSERT INTO public.template_options (
      template_id,
      option_key,
      option_label,
      option_description,
      category,
      field_type,
      default_value,
      is_required,
      display_order
    ) VALUES (
      template_record.id,
      'business_hours',
      'Horarios de atención',
      'Días y horarios en que atienden a clientes (ej: Lun-Vie 9:00-18:00, Sáb 10:00-14:00)',
      'basic',
      'textarea',
      NULL,
      TRUE,
      1
    )
    ON CONFLICT (template_id, option_key) DO NOTHING;

    -- 3. Dirección
    INSERT INTO public.template_options (
      template_id,
      option_key,
      option_label,
      option_description,
      category,
      field_type,
      default_value,
      is_required,
      display_order
    ) VALUES (
      template_record.id,
      'business_address',
      'Dirección',
      'Ubicación física de tu negocio',
      'basic',
      'text',
      NULL,
      TRUE,
      2
    )
    ON CONFLICT (template_id, option_key) DO NOTHING;

    -- 4. Teléfono de contacto
    INSERT INTO public.template_options (
      template_id,
      option_key,
      option_label,
      option_description,
      category,
      field_type,
      default_value,
      is_required,
      display_order
    ) VALUES (
      template_record.id,
      'business_phone',
      'Teléfono de contacto',
      'Número de teléfono para que los clientes te contacten',
      'basic',
      'text',
      NULL,
      TRUE,
      3
    )
    ON CONFLICT (template_id, option_key) DO NOTHING;

  END LOOP;
END $$;

-- Comentarios para documentación
COMMENT ON COLUMN public.template_options.is_required IS 'Indica si esta opción es obligatoria para completar la configuración';
