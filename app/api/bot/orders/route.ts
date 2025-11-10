import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateOrderRequest } from '@/types';
import { notifyOrderStatusChange } from '@/lib/whatsapp/notifications';

/**
 * GET /api/bot/orders
 * Lista los pedidos del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[GET /api/bot/orders] Starting request...');
    const supabase = await createClient();
    console.log('[GET /api/bot/orders] Supabase client created');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[GET /api/bot/orders] User:', user?.id, 'Auth Error:', authError);

    if (authError || !user) {
      console.error('[GET /api/bot/orders] Authentication failed:', authError);
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

    console.log('[GET /api/bot/orders] Executing query...');
    const { data: orders, error, count } = await query;

    if (error) {
      console.error('[GET /api/bot/orders] Error fetching orders:', error);
      return NextResponse.json({ error: 'Error al obtener pedidos', details: error.message }, { status: 500 });
    }

    console.log('[GET /api/bot/orders] Success! Found', orders?.length, 'orders');
    return NextResponse.json({
      orders: orders || [],
      total: count || 0,
      limit,
      offset,
    });

  } catch (error: any) {
    console.error('[GET /api/bot/orders] Caught exception:', error);
    console.error('[GET /api/bot/orders] Error message:', error?.message);
    console.error('[GET /api/bot/orders] Error stack:', error?.stack);
    return NextResponse.json({
      error: 'Error interno del servidor',
      message: error?.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
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
 * PATCH /api/bot/orders
 * Actualiza un pedido (estado, notas, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { id: orderId, notify_client = true, ...updateFields } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'ID de pedido requerido' }, { status: 400 });
    }

    const allowedFields = ['status', 'internal_notes', 'payment_status', 'delivery_time'];

    const updateData: any = {};

    allowedFields.forEach((field) => {
      if (updateFields[field] !== undefined) {
        updateData[field] = updateFields[field];
      }
    });

    // Registrar timestamps especiales
    if (updateFields.status === 'confirmed' && !updateData.confirmed_at) {
      updateData.confirmed_at = new Date().toISOString();
    }

    if (updateFields.status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
      if (updateFields.cancellation_reason) {
        updateData.cancellation_reason = updateFields.cancellation_reason;
      }
    }

    if (updateFields.status === 'delivered' && updateFields.delivery_time) {
      updateData.delivery_time = updateFields.delivery_time;
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

    // Enviar notificación al cliente si cambió el estado y notify_client es true
    if (updateFields.status && notify_client) {
      try {
        // Obtener configuración de pedidos para mensajes personalizados
        const { data: orderConfig } = await supabase
          .from('order_config')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const customMessages = orderConfig ? {
          order_confirmation_message: orderConfig.order_confirmation_message,
          preparing_message: orderConfig.preparing_message,
          in_delivery_message: orderConfig.in_delivery_message,
          delivered_message: orderConfig.delivered_message,
          cancelled_message: orderConfig.cancelled_message,
        } : undefined;

        // Enviar notificación
        const notificationSent = await notifyOrderStatusChange(
          user.id,
          order,
          updateFields.status,
          customMessages
        );

        if (!notificationSent) {
          console.warn('No se pudo enviar notificación al cliente');
        }
      } catch (notificationError) {
        console.error('Error al enviar notificación:', notificationError);
        // No fallar la actualización si falla la notificación
      }
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
