import { createClient } from '@/lib/supabase/server';

async function checkConfiguration() {
  console.log('🔍 Verificando configuración del bot...\n');

  try {
    const supabase = await createClient();

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ Error: No hay usuario autenticado');
      return;
    }

    console.log('✅ Usuario autenticado:', user.email);
    console.log('   User ID:', user.id, '\n');

    // Obtener configuración del bot
    const { data: botConfig, error: configError } = await supabase
      .from('bot_configs')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError) {
      console.error('❌ Error obteniendo configuración del bot:', configError.message);
      console.log('\n⚠️  Parece que no tienes configuración del bot. Ve a /dashboard/config para crear una.\n');
      return;
    }

    if (!botConfig) {
      console.log('⚠️  No se encontró configuración del bot.');
      console.log('   Ve a /dashboard/config para crear una configuración.\n');
      return;
    }

    console.log('✅ Configuración del bot encontrada:');
    console.log('   - ID:', botConfig.id);
    console.log('   - Activo:', botConfig.is_active ? '✅ SÍ' : '❌ NO (PAUSADO)');
    console.log('   - Modelo OpenAI:', botConfig.openai_model);
    console.log('   - Temperatura:', botConfig.temperature);
    console.log('   - API Key configurada:', botConfig.openai_api_key ? '✅ SÍ' : '⚠️  NO (usando del sistema)');
    console.log('   - Contexto principal:', botConfig.main_context.substring(0, 100) + '...');
    console.log('\n   Información del negocio:');
    console.log('   - Nombre:', botConfig.business_info?.name || 'No configurado');
    console.log('   - Teléfono:', botConfig.business_info?.phone || 'No configurado');
    console.log('   - Horarios:', botConfig.business_info?.hours || 'No configurado');
    console.log('   - Dirección:', botConfig.business_info?.address || 'No configurado');
    console.log('\n   Notificaciones:');
    console.log('   - Habilitadas:', botConfig.enable_unanswered_notifications ? '✅ SÍ' : '❌ NO');
    console.log('   - Número:', botConfig.notification_number || 'No configurado');

    // Verificar API Key de OpenAI
    console.log('\n🔑 Verificando API Keys de OpenAI:');
    const hasUserKey = !!botConfig.openai_api_key;
    const hasSystemKey = !!process.env.OPENAI_API_KEY;

    if (hasUserKey) {
      console.log('   ✅ API Key del usuario configurada');
    } else {
      console.log('   ⚠️  No hay API Key del usuario');
    }

    if (hasSystemKey) {
      console.log('   ✅ API Key del sistema (.env) configurada');
    } else {
      console.log('   ⚠️  No hay API Key del sistema');
    }

    if (!hasUserKey && !hasSystemKey) {
      console.log('\n   ❌ ERROR: No hay ninguna API Key de OpenAI configurada!');
      console.log('   Necesitas configurar una API Key en /dashboard/config o en tu archivo .env\n');
      return;
    }

    // Obtener mini tareas
    const { data: miniTasks, error: tasksError } = await supabase
      .from('mini_tasks')
      .select('*')
      .eq('bot_config_id', botConfig.id);

    if (tasksError) {
      console.log('\n⚠️  Error obteniendo mini tareas:', tasksError.message);
    } else {
      const activeTasks = miniTasks?.filter(t => t.is_active) || [];
      console.log('\n📋 Mini Tareas:');
      console.log('   - Total:', miniTasks?.length || 0);
      console.log('   - Activas:', activeTasks.length);

      if (activeTasks.length > 0) {
        console.log('\n   Tareas activas:');
        activeTasks.forEach(task => {
          console.log(`   • "${task.trigger_keyword}" (prioridad: ${task.priority})`);
        });
      }
    }

    // Verificar conexión de WhatsApp
    const { data: connection, error: connError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('\n📱 Conexión de WhatsApp:');
    if (connError || !connection) {
      console.log('   ⚠️  No hay registro de conexión');
    } else {
      console.log('   - Conectado:', connection.is_connected ? '✅ SÍ' : '❌ NO');
      console.log('   - Número:', connection.phone_number || 'No disponible');
      console.log('   - Última conexión:', connection.last_connected || 'Nunca');
    }

    console.log('\n✅ Diagnóstico completado\n');

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

checkConfiguration();
