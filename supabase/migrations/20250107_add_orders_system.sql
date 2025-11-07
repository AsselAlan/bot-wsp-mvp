-- Migración: Sistema de Gestión de Pedidos
-- Fecha: 2025-01-07
-- Descripción: Tabla para almacenar pedidos realizados por WhatsApp

-- Tabla: orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Información del pedido
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'in_delivery', 'delivered', 'cancelled')),

  -- Información del cliente
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_whatsapp_id TEXT NOT NULL,

  -- Items del pedido (JSONB array)
  items JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Dirección de entrega
  delivery_address JSONB DEFAULT '{}'::jsonb,
  -- Estructura: { calle, numero, piso_depto, barrio, referencias, zona }

  -- Información de pago
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),

  -- Costos
  subtotal DECIMAL(10, 2),
  delivery_cost DECIMAL(10, 2),
  total DECIMAL(10, 2) NOT NULL,

  -- Tiempos
  estimated_delivery_time TEXT,
  delivery_time TIMESTAMPTZ,

  -- Notas y detalles
  customer_notes TEXT,
  internal_notes TEXT,

  -- Conversación original
  conversation_snapshot JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Trigger para updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para generar número de pedido único
CREATE OR REPLACE FUNCTION generate_order_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_date TEXT;
  v_number TEXT;
BEGIN
  -- Obtener fecha actual en formato YYYYMMDD
  v_date := TO_CHAR(NOW(), 'YYYYMMDD');

  -- Contar pedidos del día para este usuario
  SELECT COUNT(*) INTO v_count
  FROM public.orders
  WHERE user_id = p_user_id
  AND created_at::date = CURRENT_DATE;

  -- Generar número: YYYYMMDD-XXX (XXX es contador del día)
  v_number := v_date || '-' || LPAD((v_count + 1)::TEXT, 3, '0');

  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders" ON public.orders
  FOR DELETE USING (auth.uid() = user_id);

-- Tabla: order_config (Configuración de toma de pedidos)
CREATE TABLE IF NOT EXISTS public.order_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,

  -- Activación del sistema
  enable_order_taking BOOLEAN DEFAULT FALSE,

  -- Campos obligatorios
  require_customer_name BOOLEAN DEFAULT TRUE,
  require_delivery_address BOOLEAN DEFAULT TRUE,
  require_payment_method BOOLEAN DEFAULT TRUE,

  -- Configuración de dirección
  address_fields JSONB DEFAULT '{"calle": true, "numero": true, "barrio": true, "referencias": false, "piso_depto": false}'::jsonb,

  -- Zonas de delivery
  delivery_zones JSONB DEFAULT '[]'::jsonb,
  -- Estructura: [{ nombre: "Centro", costo: 200, activa: true }]

  -- Métodos de pago
  payment_methods JSONB DEFAULT '["Efectivo", "Transferencia"]'::jsonb,

  -- Mensajes personalizados
  order_confirmation_message TEXT DEFAULT '✅ Tu pedido #{order_number} fue recibido. Te llegará en {estimated_time}.',
  missing_info_message TEXT DEFAULT 'Para completar tu pedido necesito que me brindes: {missing_fields}',
  out_of_zone_message TEXT DEFAULT 'Lo siento, no realizamos envíos a esa zona. Nuestras zonas son: {zones}',

  -- Comportamiento del bot
  auto_confirm_orders BOOLEAN DEFAULT FALSE,
  request_confirmation BOOLEAN DEFAULT TRUE,

  -- Estimación de tiempos
  default_delivery_time TEXT DEFAULT '30-45 minutos',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_order_config_user_id ON public.order_config(user_id);

-- Trigger para updated_at
CREATE TRIGGER update_order_config_updated_at
  BEFORE UPDATE ON public.order_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS para order_config
ALTER TABLE public.order_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order config" ON public.order_config
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own order config" ON public.order_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own order config" ON public.order_config
  FOR UPDATE USING (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE public.orders IS 'Pedidos realizados por clientes vía WhatsApp';
COMMENT ON COLUMN public.orders.order_number IS 'Número único de pedido (formato: YYYYMMDD-XXX)';
COMMENT ON COLUMN public.orders.items IS 'Array de items del pedido: [{ producto, cantidad, precio, detalles }]';
COMMENT ON COLUMN public.orders.delivery_address IS 'Dirección completa de entrega en formato JSON';
COMMENT ON COLUMN public.orders.conversation_snapshot IS 'Snapshot de la conversación que originó el pedido';

COMMENT ON TABLE public.order_config IS 'Configuración del sistema de toma de pedidos por usuario';
COMMENT ON COLUMN public.order_config.delivery_zones IS 'Zonas de delivery con costos asociados';
COMMENT ON COLUMN public.order_config.address_fields IS 'Configuración de qué campos de dirección son obligatorios';
