import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/bot/message-flows/create-default
 * Crea el flujo predeterminado de "Tomar Pedido" para el usuario actual
 * Solo funciona si tiene la plantilla de delivery seleccionada
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar si ya tiene un flujo predeterminado
    const { data: existingFlows } = await supabase
      .from('message_flows')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_default', true);

    if (existingFlows && existingFlows.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Ya existe un flujo predeterminado',
      });
    }

    // Llamar a la función SQL para crear el flujo
    const { error: createError } = await supabase.rpc('create_default_delivery_flow', {
      p_user_id: user.id,
    });

    if (createError) {
      console.error('Error al crear flujo predeterminado:', createError);
      return NextResponse.json(
        { success: false, error: 'Error al crear flujo predeterminado' },
        { status: 500 }
      );
    }

    // Obtener el flujo recién creado
    const { data: newFlow } = await supabase
      .from('message_flows')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Flujo predeterminado creado exitosamente',
      flow: newFlow,
    });

  } catch (error) {
    console.error('Error en POST /api/bot/message-flows/create-default:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
