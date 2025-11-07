import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: Obtener todas las mini tareas del usuario
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Primero obtener el bot_config_id del usuario
    const { data: config } = await supabase
      .from('bot_configs')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!config) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No hay configuración de bot aún'
      });
    }

    // Obtener mini tareas
    const { data, error } = await supabase
      .from('mini_tasks')
      .select('*')
      .eq('bot_config_id', config.id)
      .order('priority', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Error al obtener mini tareas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener mini tareas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// POST: Crear nueva mini tarea
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { trigger_keyword, response_text, priority, is_active } = body;

    // Validaciones
    if (!trigger_keyword || trigger_keyword.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'La palabra clave es requerida' },
        { status: 400 }
      );
    }

    if (!response_text || response_text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'La respuesta es requerida' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener bot_config_id del usuario
    const { data: config } = await supabase
      .from('bot_configs')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Debes crear la configuración del bot primero' },
        { status: 400 }
      );
    }

    // Crear mini tarea
    const { data, error } = await supabase
      .from('mini_tasks')
      .insert({
        bot_config_id: config.id,
        trigger_keyword: trigger_keyword.trim().toLowerCase(),
        response_text: response_text.trim(),
        priority: priority || 0,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Mini tarea creada exitosamente'
    });

  } catch (error) {
    console.error('Error al crear mini tarea:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear mini tarea',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// PUT: Actualizar mini tarea
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, trigger_keyword, response_text, priority, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'El ID de la mini tarea es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar que la mini tarea pertenece al usuario
    const { data: config } = await supabase
      .from('bot_configs')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    if (trigger_keyword !== undefined) updateData.trigger_keyword = trigger_keyword.trim().toLowerCase();
    if (response_text !== undefined) updateData.response_text = response_text.trim();
    if (priority !== undefined) updateData.priority = priority;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Actualizar mini tarea
    const { data, error } = await supabase
      .from('mini_tasks')
      .update(updateData)
      .eq('id', id)
      .eq('bot_config_id', config.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Mini tarea actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar mini tarea:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar mini tarea',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar mini tarea
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'El ID de la mini tarea es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar que la mini tarea pertenece al usuario
    const { data: config } = await supabase
      .from('bot_configs')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Eliminar mini tarea
    const { error } = await supabase
      .from('mini_tasks')
      .delete()
      .eq('id', id)
      .eq('bot_config_id', config.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Mini tarea eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar mini tarea:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar mini tarea',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
