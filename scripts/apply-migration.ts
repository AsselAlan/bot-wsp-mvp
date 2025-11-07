import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Leer el archivo de migración
  const migrationPath = path.join(__dirname, '../supabase/migrations/20250107_add_prompt_config.sql');

  console.log('📂 Leyendo archivo de migración:', migrationPath);

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ No se encontró el archivo de migración');
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('🚀 Aplicando migración...\n');

  try {
    // Ejecutar la migración
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Error al aplicar migración:', error);
      process.exit(1);
    }

    console.log('✅ Migración aplicada exitosamente!');
    console.log('\n📋 Campos agregados a bot_configs:');
    console.log('   - tone (formal | casual | friendly)');
    console.log('   - use_emojis (never | moderate | frequent)');
    console.log('   - strict_mode (boolean)');
    console.log('   - response_length (short | medium | long)');
    console.log('   - custom_instructions (text)');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  }
}

applyMigration();
