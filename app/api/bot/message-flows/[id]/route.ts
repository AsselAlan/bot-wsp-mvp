import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UpdateMessageFlowRequest } from '@/types';

/**
 * GET /api/bot/message-flows/[id]
 * Obtiene un flujo específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const { data: flow, error } = await supabase
      .from('message_flows')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !flow) {
      return NextResponse.json(
        { success: false, error: 'Flujo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      flow,
    });

  } catch (error) {
    console.error('Error en GET /api/bot/message-flows/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bot/message-flows/[id]
 * Actualiza un flujo existente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Leer body
    const body: UpdateMessageFlowRequest = await request.json();

    // Preparar datos a actualizar
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.activation_type !== undefined) updateData.activation_type = body.activation_type;
    if (body.activation_keywords !== undefined) updateData.activation_keywords = body.activation_keywords;
    if (body.activation_prompt !== undefined) updateData.activation_prompt = body.activation_prompt;
    if (body.steps !== undefined) updateData.steps = body.steps;
    if (body.final_action !== undefined) updateData.final_action = body.final_action;
    if (body.timeout_minutes !== undefined) updateData.timeout_minutes = body.timeout_minutes;
    if (body.allow_restart !== undefined) updateData.allow_restart = body.allow_restart;
    if (body.error_message !== undefined) updateData.error_message = body.error_message;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    // Actualizar
    const { data: flow, error } = await supabase
      .from('message_flows')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar flujo:', error);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el flujo' },
        { status: 500 }
      );
    }

    if (!flow) {
      return NextResponse.json(
        { success: false, error: 'Flujo no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      flow,
    });

  } catch (error) {
    console.error('Error en PUT /api/bot/message-flows/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bot/message-flows/[id]
 * Elimina un flujo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    // Eliminar el flujo
    const { error } = await supabase
      .from('message_flows')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error al eliminar flujo:', error);
      return NextResponse.json(
        { success: false, error: 'Error al eliminar el flujo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Flujo eliminado exitosamente',
    });

  } catch (error) {
    console.error('Error en DELETE /api/bot/message-flows/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
