import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST: Pausar/Reanudar el bot
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
    const { is_active } = body;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'El campo is_active es requerido y debe ser booleano' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Actualizar estado del bot
    const { data, error } = await supabase
      .from('bot_configs')
      .update({ is_active })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'No se encontró la configuración del bot' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: is_active ? 'Bot reanudado exitosamente' : 'Bot pausado exitosamente'
    });

  } catch (error) {
    console.error('Error al cambiar estado del bot:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al cambiar estado del bot',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// GET: Obtener estado actual del bot
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

    const { data, error } = await supabase
      .from('bot_configs')
      .select('is_active')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        is_active: data?.is_active ?? false
      }
    });

  } catch (error) {
    console.error('Error al obtener estado del bot:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener estado del bot',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
