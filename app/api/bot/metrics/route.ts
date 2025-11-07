import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: Obtener métricas del bot
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
    const today = new Date().toISOString().split('T')[0];

    // Obtener métricas de hoy
    const { data: todayMetrics } = await supabase
      .from('chat_metrics')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    // Obtener total de mensajes históricos
    const { count: totalMessages } = await supabase
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Obtener mensajes sin responder (no revisados)
    const { count: unansweredCount } = await supabase
      .from('unanswered_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_reviewed', false);

    const metrics = {
      totalChats: totalMessages || 0,
      dailyChats: todayMetrics?.daily_chats || 0,
      botResponses: todayMetrics?.bot_responses || 0,
      unansweredCount: unansweredCount || 0,
    };

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error al obtener métricas:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener métricas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
