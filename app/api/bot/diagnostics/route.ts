import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      status: 'ok',
      checks: []
    };

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      diagnostics.status = 'error';
      diagnostics.error = 'No hay usuario autenticado';
      return NextResponse.json(diagnostics);
    }

    diagnostics.user = {
      id: user.id,
      email: user.email
    };

    // Obtener configuración del bot
    const { data: botConfig, error: configError } = await supabase
      .from('bot_configs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError || !botConfig) {
      diagnostics.checks.push({
        name: 'Bot Config',
        status: 'error',
        message: 'No se encontró configuración del bot. Ve a /dashboard/config para crear una.',
        error: configError?.message
      });
      diagnostics.status = 'error';
    } else {
      const hasUserKey = !!botConfig.openai_api_key;
      const hasSystemKey = !!process.env.OPENAI_API_KEY;
      const hasAnyKey = hasUserKey || hasSystemKey;

      diagnostics.checks.push({
        name: 'Bot Config',
        status: 'ok',
        data: {
          id: botConfig.id,
          is_active: botConfig.is_active,
          model: botConfig.openai_model,
          temperature: botConfig.temperature,
          has_user_api_key: hasUserKey,
          has_system_api_key: hasSystemKey,
          has_any_api_key: hasAnyKey,
          main_context_length: botConfig.main_context?.length || 0,
          business_info: botConfig.business_info,
          notifications_enabled: botConfig.enable_unanswered_notifications,
          notification_number: botConfig.notification_number
        }
      });

      if (!botConfig.is_active) {
        diagnostics.checks.push({
          name: 'Bot Status',
          status: 'warning',
          message: '⚠️ El bot está PAUSADO. Ve a /dashboard/config y actívalo.'
        });
      }

      if (!hasAnyKey) {
        diagnostics.checks.push({
          name: 'OpenAI API Key',
          status: 'error',
          message: '❌ No hay API Key de OpenAI configurada. Configura una en /dashboard/config o en tu .env'
        });
        diagnostics.status = 'error';
      } else {
        diagnostics.checks.push({
          name: 'OpenAI API Key',
          status: 'ok',
          message: hasUserKey ? 'API Key del usuario configurada' : 'Usando API Key del sistema'
        });
      }

      if (!botConfig.main_context || botConfig.main_context.trim().length === 0) {
        diagnostics.checks.push({
          name: 'Main Context',
          status: 'warning',
          message: '⚠️ El contexto principal está vacío. Define cómo debe comportarse el bot.'
        });
      }
    }

    // Obtener mini tareas
    if (botConfig) {
      const { data: miniTasks } = await supabase
        .from('mini_tasks')
        .select('*')
        .eq('bot_config_id', botConfig.id);

      const activeTasks = miniTasks?.filter(t => t.is_active) || [];

      diagnostics.checks.push({
        name: 'Mini Tasks',
        status: 'info',
        data: {
          total: miniTasks?.length || 0,
          active: activeTasks.length,
          tasks: activeTasks.map(t => ({
            keyword: t.trigger_keyword,
            priority: t.priority
          }))
        }
      });
    }

    // Verificar conexión de WhatsApp
    const { data: connection } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (connection) {
      diagnostics.checks.push({
        name: 'WhatsApp Connection',
        status: connection.is_connected ? 'ok' : 'warning',
        data: {
          is_connected: connection.is_connected,
          phone_number: connection.phone_number,
          last_connected: connection.last_connected
        }
      });
    }

    // Verificar mensajes sin responder
    const { count: unansweredCount } = await supabase
      .from('unanswered_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    diagnostics.checks.push({
      name: 'Unanswered Messages',
      status: 'info',
      data: {
        total: unansweredCount || 0
      }
    });

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error) {
    console.error('Error en diagnóstico:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
