-- Función para crear flujo predeterminado de "Tomar Pedido" para usuarios con plantilla de Delivery
-- Esta función se ejecutará automáticamente cuando un usuario seleccione la plantilla de delivery

CREATE OR REPLACE FUNCTION create_default_delivery_flow(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_template_id UUID;
  v_existing_flow_count INTEGER;
BEGIN
  -- Obtener el ID de la plantilla de delivery
  SELECT id INTO v_template_id
  FROM business_templates
  WHERE slug = 'servicio-delivery-comida'
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE NOTICE 'Plantilla de delivery no encontrada';
    RETURN;
  END IF;

  -- Verificar si el usuario ya tiene un flujo predeterminado
  SELECT COUNT(*) INTO v_existing_flow_count
  FROM message_flows
  WHERE user_id = p_user_id
    AND is_default = true;

  -- Si ya tiene un flujo predeterminado, no crear otro
  IF v_existing_flow_count > 0 THEN
    RAISE NOTICE 'El usuario ya tiene un flujo predeterminado';
    RETURN;
  END IF;

  -- Crear el flujo predeterminado de "Tomar Pedido"
  INSERT INTO message_flows (
    user_id,
    name,
    description,
    icon,
    is_active,
    is_default,
    activation_type,
    activation_keywords,
    activation_prompt,
    steps,
    final_action,
    timeout_minutes,
    allow_restart,
    error_message
  )
  VALUES (
    p_user_id,
    'Tomar Pedido',
    'Flujo conversacional para tomar pedidos de delivery paso a paso',
    '🛵',
    true, -- Activo por defecto
    true, -- Marcar como flujo predeterminado
    'keywords', -- Activación por palabras clave
    ARRAY['pedido', 'pedir', 'quiero', 'comprar', 'ordenar', 'delivery'], -- Palabras clave
    NULL, -- No usa prompt de IA en este caso
    -- Pasos del flujo
    '[
      {
        "order": 1,
        "context": "Saludo inicial y confirmación de que quiere hacer un pedido",
        "expected_trigger": "Confirmación del cliente que quiere hacer un pedido",
        "bot_response": "¡Perfecto! Con gusto te ayudo a tomar tu pedido. ¿Qué te gustaría ordenar?",
        "validation_type": "any"
      },
      {
        "order": 2,
        "context": "Recopilar los productos que desea el cliente",
        "expected_trigger": "Lista de productos o items que desea",
        "bot_response": "Perfecto, anotado. ¿A qué dirección lo enviamos?",
        "validation_type": "any"
      },
      {
        "order": 3,
        "context": "Obtener la dirección de entrega completa",
        "expected_trigger": "Dirección completa con calle, número y barrio",
        "bot_response": "Excelente. ¿Cómo vas a pagar? (Efectivo, transferencia, etc.)",
        "validation_type": "any"
      },
      {
        "order": 4,
        "context": "Confirmar método de pago",
        "expected_trigger": "Método de pago elegido",
        "bot_response": "¡Listo! Tu pedido está confirmado. Te llegará en aproximadamente 30-45 minutos. ¡Gracias por tu compra!",
        "validation_type": "any"
      }
    ]'::jsonb,
    -- Acción final: Crear pedido
    '{
      "type": "create_order",
      "config": {
        "auto_confirm": true
      }
    }'::jsonb,
    30, -- Timeout de 30 minutos
    true, -- Permitir reiniciar
    'Lo siento, hubo un error. ¿Quieres empezar de nuevo con tu pedido?'
  );

  RAISE NOTICE 'Flujo predeterminado de delivery creado exitosamente';
END;
$$ LANGUAGE plpgsql;

-- Comentario de la función
COMMENT ON FUNCTION create_default_delivery_flow(UUID) IS 'Crea un flujo conversacional predeterminado de "Tomar Pedido" para usuarios con plantilla de delivery';

-- Ejemplo de uso:
-- SELECT create_default_delivery_flow('user-uuid-here');
