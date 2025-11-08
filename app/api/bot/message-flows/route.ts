import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateMessageFlowRequest } from '@/types';

/**
 * GET /api/bot/message-flows
 * Obtiene todos los flujos de mensajes del usuario
 */
export async function GET(request: NextRequest) {
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

    // Obtener flujos del usuario
    const { data: flows, error } = await supabase
      .from('message_flows')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener flujos:', error);
      return NextResponse.json(
        { success: false, error: 'Error al obtener flujos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      flows: flows || [],
    });

  } catch (error) {
    console.error('Error en GET /api/bot/message-flows:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bot/message-flows
 * Crea un nuevo flujo de mensajes
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

    // Leer body
    const body: CreateMessageFlowRequest = await request.json();

    // Validaciones básicas
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      );
    }

    if (!body.activation_type || !['keywords', 'ai'].includes(body.activation_type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de activación inválido' },
        { status: 400 }
      );
    }

    if (!body.steps || body.steps.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El flujo debe tener al menos un paso' },
        { status: 400 }
      );
    }

    if (body.activation_type === 'keywords' && (!body.activation_keywords || body.activation_keywords.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Debes proporcionar palabras clave' },
        { status: 400 }
      );
    }

    if (body.activation_type === 'ai' && !body.activation_prompt) {
      return NextResponse.json(
        { success: false, error: 'Debes proporcionar un prompt para la IA' },
        { status: 400 }
      );
    }

    // Crear el flujo
    const { data: flow, error } = await supabase
      .from('message_flows')
      .insert({
        user_id: user.id,
        name: body.name,
        description: body.description || null,
        icon: body.icon || '💬',
        activation_type: body.activation_type,
        activation_keywords: body.activation_keywords || null,
        activation_prompt: body.activation_prompt || null,
        steps: body.steps,
        final_action: body.final_action,
        timeout_minutes: body.timeout_minutes || 30,
        allow_restart: body.allow_restart !== false,
        error_message: body.error_message || 'Lo siento, hubo un error. ¿Deseas empezar de nuevo?',
        is_active: true,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear flujo:', error);
      return NextResponse.json(
        { success: false, error: 'Error al crear el flujo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      flow,
    });

  } catch (error) {
    console.error('Error en POST /api/bot/message-flows:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
