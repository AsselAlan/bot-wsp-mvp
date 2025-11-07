import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateOrderRequest } from '@/types';

/**
 * GET /api/bot/orders
 * Lista los pedidos del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
    }

    return NextResponse.json({
      orders: orders || [],
      total: count || 0,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Error in GET /api/bot/orders:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * POST /api/bot/orders
 * Crea un nuevo pedido
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body: CreateOrderRequest = await request.json();

    // Validaciones
    if (!body.customer_name || !body.customer_phone || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: customer_name, customer_phone, items' },
        { status: 400 }
      );
    }

    // Generar número de pedido
    const { data: orderNumberData } = await supabase.rpc('generate_order_number', {
      p_user_id: user.id,
    });

    const orderNumber = orderNumberData || `${Date.now()}`;

    // Calcular costos
    const subtotal = body.items.reduce((sum, item) => sum + (item.precio || 0) * item.cantidad, 0);
    const deliveryAddress = body.delivery_address || {};

    // Obtener costo de delivery según zona
    const { data: orderConfig } = await supabase
      .from('order_config')
      .select('delivery_zones, default_delivery_time')
      .eq('user_id', user.id)
      .single();

    let deliveryCost = 0;
    let estimatedTime = orderConfig?.default_delivery_time || '30-45 minutos';

    if (deliveryAddress.zona && orderConfig?.delivery_zones) {
      const zone = orderConfig.delivery_zones.find((z: any) => z.nombre === deliveryAddress.zona);
      if (zone) {
        deliveryCost = zone.costo;
      }
    }

    const total = body.total || (subtotal + deliveryCost);

    // Insertar pedido
    const { data: order, error: insertError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        status: 'pending',
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_whatsapp_id: body.customer_whatsapp_id,
        items: body.items,
        delivery_address: deliveryAddress,
        payment_method: body.payment_method || null,
        payment_status: 'pending',
        subtotal,
        delivery_cost: deliveryCost,
        total,
        estimated_delivery_time: estimatedTime,
        customer_notes: body.customer_notes || null,
        conversation_snapshot: body.conversation_snapshot || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting order:', insertError);
      return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Pedido creado exitosamente',
      order,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/bot/orders:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * PATCH /api/bot/orders/[id]
 * Actualiza un pedido (estado, notas, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'ID de pedido requerido' }, { status: 400 });
    }

    const body = await request.json();
    const allowedFields = ['status', 'internal_notes', 'payment_status', 'delivery_time'];

    const updateData: any = {};

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Registrar timestamps especiales
    if (body.status === 'confirmed' && !updateData.confirmed_at) {
      updateData.confirmed_at = new Date().toISOString();
    }

    if (body.status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      if (body.cancellation_reason) {
        updateData.cancellation_reason = body.cancellation_reason;
      }
    }

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({ error: 'Error al actualizar pedido' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Pedido actualizado exitosamente',
      order,
    });

  } catch (error) {
    console.error('Error in PATCH /api/bot/orders:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
