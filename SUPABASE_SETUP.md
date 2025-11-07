# Configuración de Supabase - Guía Rápida

## ⚡ Quick Start

### Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Crea una cuenta o inicia sesión
4. Clic en "New Project"
5. Completa:
   - **Name**: whatsapp-bot-app
   - **Database Password**: [Guarda esta contraseña]
   - **Region**: Elige la más cercana
6. Espera 1-2 minutos mientras se crea el proyecto

### Paso 2: Obtener Credenciales

1. En el dashboard de tu proyecto, ve a **Settings** (⚙️ icono en la sidebar)
2. Clic en **API**
3. Copia estos valores:

```
Project URL: https://[tu-proyecto].supabase.co
anon public key: eyJ...  (es largo)
service_role key: eyJ... (es largo, mantenlo secreto)
```

### Paso 3: Configurar Variables de Entorno

1. En tu proyecto, copia `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edita `.env.local` y pega tus credenciales:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   ```

### Paso 4: Ejecutar el Schema SQL

1. En Supabase, ve a **SQL Editor** (📊 icono en sidebar)
2. Clic en "New Query"
3. Abre el archivo `supabase/schema.sql` de tu proyecto
4. **Copia TODO el contenido** (son ~350 líneas)
5. Pégalo en el SQL Editor
6. Clic en **RUN** (o presiona Ctrl+Enter)
7. Deberías ver: "Success. No rows returned"

### Paso 5: Verificar que las Tablas se Crearon

1. Ve a **Table Editor** (📋 icono en sidebar)
2. Deberías ver estas tablas:
   - users
   - whatsapp_connections
   - bot_configs
   - mini_tasks
   - chat_metrics
   - message_logs

✅ Si las ves, **¡todo está listo!**

### Paso 6: Reiniciar el Servidor

```bash
# Detener el servidor (Ctrl+C)
# Iniciar nuevamente
npm run dev
```

### Paso 7: Probar la Autenticación

1. Ve a: `http://localhost:3000/register`
2. Registra una cuenta con tu email
3. **Importante:** Revisa tu bandeja de entrada
4. Haz clic en el enlace de verificación
5. Inicia sesión en: `http://localhost:3000/login`
6. Deberías ser redirigido al dashboard

---

## 🔧 Configuración de Email (Opcional)

Por defecto, Supabase envía emails de verificación. Para desarrollo:

### Opción 1: Desactivar Verificación de Email (Solo Desarrollo)

1. En Supabase, ve a **Authentication** > **Settings**
2. Desactiva "Enable email confirmations"
3. Ahora puedes registrarte sin verificar el email

### Opción 2: Usar tu Propio SMTP

1. Ve a **Authentication** > **Settings** > **SMTP Settings**
2. Configura tu servidor SMTP (Gmail, SendGrid, etc.)

---

## 🧪 Probar la Integración

### Test 1: Registro y Login

```bash
# 1. Registra una cuenta
http://localhost:3000/register

# 2. Si desactivaste verificación, puedes iniciar sesión directo
# Si no, verifica tu email primero

# 3. Inicia sesión
http://localhost:3000/login
```

### Test 2: Protección de Rutas

```bash
# 1. Sin estar logueado, intenta acceder:
http://localhost:3000/dashboard

# Deberías ser redirigido a /login
```

### Test 3: Conexión de WhatsApp con Usuario Real

```bash
# 1. Inicia sesión
# 2. Ve a Dashboard > Conexión
# 3. Genera código QR
# 4. Escanea con WhatsApp

# Ahora la conexión está vinculada a TU usuario específico
```

---

## 📊 Ver tus Datos en Supabase

### Ver Usuarios Registrados

1. Ve a **Authentication** en Supabase
2. Verás tu usuario registrado

### Ver Conexiones de WhatsApp

1. Ve a **Table Editor** > `whatsapp_connections`
2. Verás las conexiones vinculadas a usuarios

### Ver Logs de Mensajes (Próximamente)

1. Ve a **Table Editor** > `message_logs`
2. Aquí aparecerán los mensajes cuando implementes Fase 5

---

## ❌ Troubleshooting

### Error: "Invalid API key"

**Solución:**
- Verifica que copiaste correctamente las keys de Supabase
- Asegúrate de que no haya espacios al inicio o final
- Reinicia el servidor después de cambiar `.env.local`

### Error: "Failed to fetch"

**Solución:**
- Verifica que el Project URL sea correcto
- Asegúrate de incluir `https://` al inicio

### No recibo el email de verificación

**Solución:**
1. Revisa spam
2. Verifica que el email esté correcto
3. En Supabase, ve a Authentication > Users
4. Verás el usuario con status "Unconfirmed"
5. Puedes hacer clic en los 3 puntos (...) > "Send magic link"
6. O desactiva email confirmation (solo desarrollo)

### Error: "relation does not exist"

**Solución:**
- No se ejecutó el schema SQL correctamente
- Ve a SQL Editor y ejecuta `supabase/schema.sql` completo
- Verifica que no haya errores en la ejecución

### Las rutas no están protegidas

**Solución:**
- Verifica que `middleware.ts` exista en la raíz del proyecto
- Reinicia el servidor
- Limpia caché del navegador (Ctrl+Shift+R)

---

## 🔐 Row Level Security (RLS)

El schema ya incluye políticas RLS. Esto significa:

✅ **Cada usuario solo ve SUS datos:**
- Sus propias conexiones de WhatsApp
- Su propia configuración
- Sus propias métricas
- Sus propios logs

✅ **No puede ver datos de otros usuarios**

✅ **Seguridad a nivel de base de datos**

---

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Checklist de Configuración

Marca cada paso cuando lo completes:

- [ ] Crear proyecto en Supabase
- [ ] Copiar credenciales a `.env.local`
- [ ] Ejecutar `supabase/schema.sql`
- [ ] Verificar que las tablas existan
- [ ] Reiniciar servidor de desarrollo
- [ ] Registrar una cuenta de prueba
- [ ] Verificar email (o desactivar verificación)
- [ ] Iniciar sesión exitosamente
- [ ] Acceder al dashboard
- [ ] Conectar WhatsApp con usuario real

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tendrás:

✅ Autenticación funcionando
✅ Usuarios en Supabase
✅ Rutas protegidas
✅ WhatsApp vinculado a usuarios reales
✅ Base de datos configurada

**Próximo paso:** Usar la aplicación y conectar tu WhatsApp!
