# 🚀 Instrucciones para Configurar el Sistema de Roles

## Paso 1: Ejecutar SQL en Supabase

1. Ve a tu proyecto de Supabase: https://ltumrhvqsdfkqszxtyed.supabase.co
2. En el menú lateral, haz clic en **SQL Editor**
3. Haz clic en **New Query**
4. Copia y pega TODO el contenido del archivo `EJECUTAR_EN_SUPABASE.sql`
5. Haz clic en **Run** (o presiona Ctrl+Enter)
6. Verifica que al final de la ejecución veas una tabla con tu usuario marcado como "✅ ADMIN"

## Paso 2: Verificar en la Aplicación

1. Asegúrate de que la aplicación esté corriendo:
   ```bash
   npm run dev
   ```

2. Accede a http://localhost:3000

3. Haz login con tu usuario existente

4. Deberías ver:
   - Badge "ADMIN" en el header
   - Sidebar con: "Mis Clientes", "Dashboard", "Configuración", "Flujos de Trabajo"
   - Dashboard con estadísticas globales

## Paso 3: Crear un Cliente de Prueba

1. En el sidebar, haz clic en **"Mis Clientes"**
2. Haz clic en el botón **"Nuevo Cliente"**
3. Completa el formulario:
   - Email: `cliente@test.com`
   - Genera una contraseña (botón "Generar")
   - Nombre del Negocio: `Pizzería Test`
   - Plantilla: Selecciona "Food Delivery" o la que prefieras
4. Haz clic en **"Crear Cliente"**
5. Guarda la contraseña generada

## Paso 4: Probar Vista de Cliente

1. Abre una ventana de incógnito o cierra sesión
2. Haz login con las credenciales del cliente que creaste
3. Deberías ver:
   - Sidebar simple con: "Pedidos", "Conexión WhatsApp", "Mensajes Sin Responder"
   - Campana de notificaciones en el header
   - Dashboard con vista limitada
   - Alerta indicando que la configuración es gestionada por el admin

## Paso 5: Configurar un Cliente como Admin

1. Vuelve a hacer login como admin
2. Ve a **"Mis Clientes"**
3. Busca el cliente que creaste
4. Haz clic en **"Configurar"**
5. Serás redirigido a la página de Configuración
6. Verás en el header: "Configurando bot para: [nombre del cliente]"
7. Completa la configuración en los 4 tabs:
   - **Plantilla**: Ya seleccionada
   - **Negocio**: Completa datos del negocio
   - **Pedidos**: Configura zonas de delivery, métodos de pago (si aplica)
   - **Técnico**: API Keys, notificaciones

## ✅ Verificación Final

Si todo funciona correctamente, deberías poder:

- [x] Ver badge "ADMIN" cuando haces login como admin
- [x] Acceder a "Mis Clientes" y ver la lista
- [x] Crear nuevos clientes desde el panel
- [x] Configurar bots de otros clientes
- [x] Ver estadísticas globales en el dashboard
- [x] Como cliente, ver solo tu panel limitado
- [x] Como cliente, recibir notificaciones de pedidos nuevos

## 🆘 Solución de Problemas

### Error: "No se puede acceder a la página de clientes"
- Verifica que el SQL se ejecutó correctamente
- Verifica en Supabase (Table Editor > users) que tu usuario tiene `role = 'admin'`

### Error: "Las políticas RLS están bloqueando el acceso"
- Ejecuta nuevamente todo el SQL del archivo `EJECUTAR_EN_SUPABASE.sql`
- Asegúrate de que las funciones `is_admin()` y `get_user_role()` se crearon correctamente

### El cliente no puede ver nada
- Verifica que el cliente tenga `role = 'client'` en la tabla users
- Verifica que tenga un registro en `bot_configs`

## 📚 Archivos Importantes

- `EJECUTAR_EN_SUPABASE.sql` - Script SQL completo para ejecutar
- `supabase/migrations/20250109_add_role_system.sql` - Migración original
- `lib/auth/roleHelpers.ts` - Funciones TypeScript para roles
- `contexts/AdminContext.tsx` - Context para gestión de clientes

## 🎯 Próximos Pasos

Una vez que el sistema de roles esté funcionando:

1. Configura el primer cliente de prueba completamente
2. Prueba el flujo de pedidos
3. Verifica las notificaciones
4. Ajusta los mensajes y configuraciones según necesites

¡El sistema está listo para usar!
