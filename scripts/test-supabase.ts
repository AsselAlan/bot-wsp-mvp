/**
 * Script para probar la conexión con Supabase
 * Ejecutar con: npx tsx scripts/test-supabase.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
config({ path: '.env.local' });

async function testSupabase() {
  console.log('🔍 Verificando configuración de Supabase...\n');

  // Verificar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL no está configurada');
    process.exit(1);
  }

  if (!supabaseKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada');
    process.exit(1);
  }

  console.log('✅ Variables de entorno configuradas');
  console.log(`📍 URL: ${supabaseUrl}\n`);

  // Crear cliente
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Verificar conexión
    console.log('Test 1: Verificando conexión...');
    const { data, error } = await supabase.from('users').select('count').single();

    if (error) {
      if (error.message.includes('relation "public.users" does not exist')) {
        console.error('❌ La tabla "users" no existe.');
        console.error('   Necesitas ejecutar el schema SQL en Supabase.');
        console.error('   Archivo: supabase/schema.sql\n');
        process.exit(1);
      }
      throw error;
    }

    console.log('✅ Conexión exitosa\n');

    // Test 2: Listar tablas
    console.log('Test 2: Verificando tablas...');
    const tables = [
      'users',
      'whatsapp_connections',
      'bot_configs',
      'mini_tasks',
      'chat_metrics',
      'message_logs'
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.error(`❌ Tabla "${table}" no encontrada o error: ${error.message}`);
      } else {
        console.log(`✅ Tabla "${table}" existe`);
      }
    }

    console.log('\n✅ ¡Supabase está configurado correctamente!');
    console.log('\nPuedes continuar con:');
    console.log('1. Registrar una cuenta en /register');
    console.log('2. Verificar tu email');
    console.log('3. Iniciar sesión en /login');

  } catch (error) {
    console.error('\n❌ Error al conectar con Supabase:');
    console.error(error);
    process.exit(1);
  }
}

testSupabase();
