import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/bot/order-config
 * Obtiene la configuración de pedidos del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: config, error } = await supabase
      .from('order_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching order config:', error);
      return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 });
    }

    // Si no existe, retornar configuración por defecto
    if (!config) {
      return NextResponse.json({
        config: null,
        message: 'No hay configuración de pedidos',
      });
    }

    return NextResponse.json({ config });

  } catch (error) {
    console.error('Error in GET /api/bot/order-config:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * POST /api/bot/order-config
 * Crea la configuración de pedidos
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    // Verificar si ya existe
    const { data: existing } = await supabase
      .from('order_config')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe configuración. Usa PUT para actualizar.' },
        { status: 400 }
      );
    }

    // Crear configuración
    const { data: config, error: insertError } = await supabase
      .from('order_config')
      .insert({
        user_id: user.id,
        enable_order_taking: body.enable_order_taking ?? false,
        require_customer_name: body.require_customer_name ?? true,
        require_delivery_address: body.require_delivery_address ?? true,
        require_payment_method: body.require_payment_method ?? true,
        address_fields: body.address_fields || {
          calle: true,
          numero: true,
          barrio: true,
          referencias: false,
          piso_depto: false,
        },
        delivery_zones: body.delivery_zones || [],
        payment_methods: body.payment_methods || ['Efectivo', 'Transferencia'],
        order_confirmation_message: body.order_confirmation_message || '✅ Tu pedido #{order_number} fue recibido. Te llegará en {estimated_time}.',
        missing_info_message: body.missing_info_message || 'Para completar tu pedido necesito que me brindes: {missing_fields}',
        out_of_zone_message: body.out_of_zone_message || 'Lo siento, no realizamos envíos a esa zona. Nuestras zonas son: {zones}',
        auto_confirm_orders: body.auto_confirm_orders ?? false,
        request_confirmation: body.request_confirmation ?? true,
        default_delivery_time: body.default_delivery_time || '30-45 minutos',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting order config:', insertError);
      return NextResponse.json({ error: 'Error al crear configuración' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Configuración creada exitosamente',
      config,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/bot/order-config:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/bot/order-config
 * Actualiza la configuración de pedidos
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();

    const updateData: any = {};

    const allowedFields = [
      'enable_order_taking',
      'require_customer_name',
      'require_delivery_address',
      'require_payment_method',
      'address_fields',
      'delivery_zones',
      'payment_methods',
      'order_confirmation_message',
      'missing_info_message',
      'out_of_zone_message',
      'auto_confirm_orders',
      'request_confirmation',
      'default_delivery_time',
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data: config, error: updateError } = await supabase
      .from('order_config')
      .update(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order config:', updateError);
      return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Configuración actualizada exitosamente',
      config,
    });

  } catch (error) {
    console.error('Error in PUT /api/bot/order-config:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
