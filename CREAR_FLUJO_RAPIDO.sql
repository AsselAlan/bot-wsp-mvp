-- SCRIPT RÁPIDO: Crea el flujo "Tomar Pedido" automáticamente
-- SOLO para usuarios con la plantilla "Servicio de Delivery de Comida"
-- Copia y pega TODO esto en el SQL Editor de Supabase y ejecuta

DO $$
DECLARE
  v_user_id UUID;
  v_delivery_template_id UUID;
BEGIN
  -- Obtener ID de la plantilla de Delivery
  SELECT id INTO v_delivery_template_id
  FROM business_templates
  WHERE slug = 'servicio-delivery-comida'
  LIMIT 1;

  -- Verificar que existe la plantilla
  IF v_delivery_template_id IS NULL THEN
    RAISE NOTICE 'No se encontró la plantilla de Delivery';
    RETURN;
  END IF;

  -- Obtener usuario que tiene la plantilla de Delivery seleccionada
  SELECT bc.user_id INTO v_user_id
  FROM bot_configs bc
  WHERE bc.selected_template_id = v_delivery_template_id
  LIMIT 1;

  -- Si no hay usuario con esa plantilla, usar el primer usuario
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM auth.users
    LIMIT 1;
    RAISE NOTICE 'No se encontró usuario con plantilla Delivery, usando primer usuario: %', v_user_id;
  ELSE
    RAISE NOTICE 'Creando flujo para usuario con plantilla Delivery: %', v_user_id;
  END IF;

  -- Crear el flujo si no existe
  IF NOT EXISTS (
    SELECT 1 FROM message_flows
    WHERE user_id = v_user_id AND is_default = true
  ) THEN
    INSERT INTO message_flows (
      user_id,
      name,
      description,
      icon,
      is_active,
      is_default,
      activation_type,
      activation_keywords,
      steps,
      final_action,
      timeout_minutes,
      allow_restart,
      error_message
    )
    VALUES (
      v_user_id,
      'Tomar Pedido',
      'Flujo conversacional para tomar pedidos de delivery paso a paso',
      '🛵',
      true,
      true,
      'keywords',
      ARRAY['pedido', 'pedir', 'quiero', 'comprar', 'ordenar', 'delivery'],
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
      '{
        "type": "create_order",
        "config": {
          "auto_confirm": true
        }
      }'::jsonb,
      30,
      true,
      'Lo siento, hubo un error. ¿Quieres empezar de nuevo con tu pedido?'
    );

    RAISE NOTICE 'Flujo creado exitosamente para user_id: %', v_user_id;
  ELSE
    RAISE NOTICE 'El flujo predeterminado ya existe';
  END IF;
END $$;

-- Verificar qué plantilla tienes seleccionada
SELECT
  u.email as usuario,
  bt.name as plantilla_seleccionada,
  bt.slug as plantilla_slug
FROM auth.users u
JOIN bot_configs bc ON bc.user_id = u.id
LEFT JOIN business_templates bt ON bt.id = bc.selected_template_id
LIMIT 1;

-- Verificar que se creó el flujo
SELECT
  mf.id,
  mf.name,
  mf.icon,
  mf.is_default,
  mf.is_active,
  mf.activation_type,
  jsonb_array_length(mf.steps) as num_steps,
  u.email as usuario_propietario
FROM message_flows mf
JOIN auth.users u ON u.id = mf.user_id
WHERE mf.is_default = true;
