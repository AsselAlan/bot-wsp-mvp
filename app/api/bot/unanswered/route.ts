import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UnansweredMessage } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/bot/unanswered
 * Obtiene los mensajes sin responder del usuario actual
 * Query params opcionales:
 * - reviewed: 'true' | 'false' | 'all' (default: 'all')
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const reviewedFilter = searchParams.get('reviewed') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir query
    let query = supabase
      .from('unanswered_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtrar por reviewed si es necesario
    if (reviewedFilter === 'true') {
      query = query.eq('is_reviewed', true);
    } else if (reviewedFilter === 'false') {
      query = query.eq('is_reviewed', false);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error fetching unanswered messages:', messagesError);
      return NextResponse.json(
        { error: 'Error al obtener mensajes sin responder' },
        { status: 500 }
      );
    }

    // Obtener estadísticas
    const { count: totalCount } = await supabase
      .from('unanswered_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: unreviewedCount } = await supabase
      .from('unanswered_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_reviewed', false);

    // Obtener total de mensajes para calcular porcentaje
    const { count: totalMessages } = await supabase
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const percentageUnanswered =
      totalMessages && totalMessages > 0
        ? ((totalCount || 0) / totalMessages) * 100
        : 0;

    return NextResponse.json({
      messages: messages as UnansweredMessage[],
      stats: {
        total: totalCount || 0,
        unreviewedCount: unreviewedCount || 0,
        percentageUnanswered: parseFloat(percentageUnanswered.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/bot/unanswered:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bot/unanswered
 * Marca un mensaje como revisado o crea un nuevo mensaje sin responder
 * Body: { messageId: string, action: 'review' | 'create', data?: {...} }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, action, data } = body;

    if (action === 'review') {
      // Marcar como revisado
      if (!messageId) {
        return NextResponse.json(
          { error: 'messageId es requerido' },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabase
        .from('unanswered_messages')
        .update({
          is_reviewed: true,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('user_id', user.id); // Seguridad: solo puede modificar sus propios mensajes

      if (updateError) {
        console.error('Error marking message as reviewed:', updateError);
        return NextResponse.json(
          { error: 'Error al marcar mensaje como revisado' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Mensaje marcado como revisado',
      });
    } else if (action === 'create') {
      // Crear nuevo mensaje sin responder
      if (!data || !data.chat_id || !data.sender_number || !data.message_text) {
        return NextResponse.json(
          { error: 'Faltan campos requeridos' },
          { status: 400 }
        );
      }

      const { error: insertError } = await supabase
        .from('unanswered_messages')
        .insert({
          user_id: user.id,
          chat_id: data.chat_id,
          sender_number: data.sender_number,
          message_text: data.message_text,
          attempted_response: data.attempted_response || null,
          reason: data.reason || 'no_match',
          is_reviewed: false,
        });

      if (insertError) {
        console.error('Error creating unanswered message:', insertError);
        return NextResponse.json(
          { error: 'Error al crear mensaje sin responder' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Mensaje sin responder guardado',
      });
    } else {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST /api/bot/unanswered:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
