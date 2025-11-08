# ⚠️ INSTRUCCIONES PARA ACTIVAR FLUJOS DE MENSAJES

## Paso 1: Ejecutar Migraciones en Supabase

Debes ejecutar las siguientes migraciones SQL en tu proyecto de Supabase para crear las tablas necesarias:

### Opción A: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en https://supabase.com/dashboard
2. Ve a **SQL Editor** en el menú lateral
3. Haz clic en **New Query**
4. Copia y pega el contenido de cada archivo en este orden:

   **Primera migración:**
   ```
   supabase/migrations/20250108_create_message_flows.sql
   ```

   **Segunda migración:**
   ```
   supabase/migrations/20250108_create_default_flow_delivery.sql
   ```

5. Ejecuta cada query haciendo clic en **Run**

### Opción B: Desde CLI de Supabase (Si tienes Supabase CLI)

```bash
# Si tienes el proyecto linkeado
npx supabase db push

# O ejecuta cada migración manualmente
npx supabase db execute --file supabase/migrations/20250108_create_message_flows.sql
npx supabase db execute --file supabase/migrations/20250108_create_default_flow_delivery.sql
```

## Paso 2: Verificar que las tablas se crearon

En el SQL Editor de Supabase, ejecuta:

```sql
-- Verificar tablas creadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('message_flows', 'flow_conversation_states');
```

Deberías ver ambas tablas listadas.

## Paso 3: (Opcional) Crear flujo predeterminado para usuarios existentes

Si ya tienes usuarios con la plantilla de Delivery, puedes crear el flujo predeterminado manualmente:

```sql
-- Reemplaza 'TU-USER-ID' con el UUID del usuario
SELECT create_default_delivery_flow('TU-USER-ID');
```

O para crear el flujo para TODOS los usuarios que tengan la plantilla de delivery:

```sql
-- Crear flujo predeterminado para todos los usuarios con plantilla de delivery
DO $$
DECLARE
  user_record RECORD;
  delivery_template_id UUID;
BEGIN
  -- Obtener ID de la plantilla de delivery
  SELECT id INTO delivery_template_id
  FROM business_templates
  WHERE slug = 'servicio-delivery-comida'
  LIMIT 1;

  -- Para cada usuario con esa plantilla
  FOR user_record IN
    SELECT DISTINCT user_id
    FROM bot_configs
    WHERE selected_template_id = delivery_template_id
  LOOP
    -- Crear flujo predeterminado
    PERFORM create_default_delivery_flow(user_record.user_id);
  END LOOP;
END $$;
```

## Paso 4: Reiniciar el servidor de desarrollo

```bash
npm run dev
```

## ✅ Verificación Final

Una vez completados los pasos, deberías poder:

1. Ir a **Dashboard → Workflows**
2. Ver el nuevo tab **"Flujos de Mensajes"**
3. Si tienes la plantilla de Delivery, verás el flujo predeterminado "Tomar Pedido"
4. Podrás crear nuevos flujos haciendo clic en el botón "+"

## 🐛 Solución de Problemas

### Error: "relation message_flows does not exist"
- Las migraciones no se ejecutaron correctamente
- Vuelve al Paso 1 y asegúrate de ejecutar ambos archivos SQL

### No veo el tab "Flujos de Mensajes"
- Asegúrate de que has reiniciado el servidor de desarrollo
- Verifica que no haya errores en la consola del navegador

### El flujo predeterminado no aparece
- Ejecuta manualmente la función `create_default_delivery_flow(user_id)` desde el Paso 3
- Verifica que tengas la plantilla de Delivery seleccionada en Workflows

## 📝 Notas Importantes

- Las migraciones solo necesitan ejecutarse **UNA VEZ**
- Una vez creadas las tablas, el sistema funciona automáticamente
- Los flujos se guardan en la base de datos y persisten
- Cada usuario puede tener múltiples flujos personalizados
