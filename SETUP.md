# Setup Guide - WhatsApp Bot App

Esta guía te ayudará a configurar el proyecto desde cero.

## Requisitos Previos

- Node.js 18+ instalado
- Una cuenta de Supabase (gratuita)
- Una API key de OpenAI
- WhatsApp instalado en tu teléfono

## Paso 1: Configurar Supabase

### 1.1 Crear Proyecto en Supabase

1. Ve a [Supabase](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Guarda la URL del proyecto y las API keys (anon key y service role key)

### 1.2 Ejecutar el Schema SQL

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Crea una nueva query
3. Copia y pega el contenido del archivo `supabase/schema.sql`
4. Ejecuta la query para crear todas las tablas y políticas

### 1.3 Configurar Autenticación

1. En Supabase, ve a **Authentication** > **Providers**
2. Habilita **Email** como proveedor de autenticación
3. Configura las URLs de redirección:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

## Paso 2: Configurar Variables de Entorno

1. Copia el archivo `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edita `.env.local` con tus credenciales:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
   SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
   OPENAI_API_KEY=tu-openai-api-key (opcional)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## Paso 3: Instalar Dependencias

```bash
npm install
```

## Paso 4: Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Paso 5: Primeros Pasos

### Registrar un Usuario

1. Ve a `http://localhost:3000/login`
2. Haz clic en "Registrarse"
3. Completa el formulario con tu email y contraseña
4. Verifica tu email (revisa la bandeja de entrada)

### Conectar WhatsApp

1. Inicia sesión en la aplicación
2. Ve a **Dashboard** > **Conexión**
3. Haz clic en "Conectar WhatsApp"
4. Escanea el código QR con WhatsApp:
   - Abre WhatsApp en tu teléfono
   - Ve a **Configuración** > **Dispositivos vinculados**
   - Toca **Vincular dispositivo**
   - Escanea el código QR

### Configurar el Bot

1. Ve a **Dashboard** > **Configuración**
2. Completa los siguientes campos:

   **Contexto Principal:**
   ```
   Eres un asistente virtual de [Nombre de tu negocio].
   Debes ser amable, profesional y ayudar a los clientes con sus consultas.
   ```

   **Información del Negocio:**
   - Nombre: Tu negocio
   - Horarios: Lunes a Viernes 9:00 - 18:00
   - Dirección: Tu dirección
   - Teléfono: Tu teléfono

   **Mini Tareas:**
   - Palabra clave: "horario"
   - Respuesta: "Nuestro horario de atención es de Lunes a Viernes de 9:00 a 18:00"

   **Configuración OpenAI:**
   - Modelo: gpt-3.5-turbo (más económico) o gpt-4 (más preciso)
   - API Key: Tu OpenAI API key
   - Temperatura: 0.7 (creatividad media)

3. Guarda la configuración

## Estructura del Proyecto

```
whatsapp-bot-app/
├── app/                    # Rutas de Next.js (App Router)
│   ├── (auth)/            # Rutas de autenticación
│   ├── dashboard/         # Dashboard principal
│   ├── api/               # API Routes
├── components/            # Componentes React
│   ├── dashboard/        # Componentes del dashboard
│   ├── config/           # Componentes de configuración
│   └── ui/               # Componentes de shadcn/ui
├── lib/                   # Librerías y utilidades
│   ├── supabase/         # Clientes de Supabase
│   ├── whatsapp/         # Cliente de WhatsApp
│   └── openai/           # Cliente de OpenAI
├── types/                 # Tipos TypeScript
└── supabase/             # Configuración de Supabase
```

## Próximos Pasos de Implementación

### Fase 1: Setup Base ✅
- [x] Crear proyecto Next.js
- [x] Configurar Tailwind CSS + shadcn/ui
- [x] Configurar Supabase
- [x] Estructura de carpetas

### Fase 2: Conexión WhatsApp (Siguiente)
- [ ] Integrar whatsapp-web.js
- [ ] Implementar generación de QR
- [ ] Página de conexión
- [ ] Manejo de sesiones

### Fase 3: Dashboard y Métricas
- [ ] Crear dashboard principal
- [ ] Componentes de métricas
- [ ] Conexión con Supabase

### Fase 4: Configuración del Bot
- [ ] Formulario de configuración
- [ ] CRUD de mini tareas
- [ ] Validaciones

### Fase 5: Integración OpenAI
- [ ] Cliente de OpenAI
- [ ] Procesador de mensajes
- [ ] Lógica de mini tareas
- [ ] Sistema de logs

### Fase 6: Testing y Deploy
- [ ] Pruebas de flujo completo
- [ ] Deploy en Vercel

## Notas Importantes

### Seguridad

- **NUNCA** compartas tus API keys públicamente
- Las API keys de OpenAI se guardan encriptadas en la base de datos
- Supabase RLS protege los datos de cada usuario

### WhatsApp Web.js

- La primera conexión puede tardar unos minutos
- El código QR expira después de 60 segundos
- Mantén la sesión activa para no tener que reconectar

### OpenAI

- Monitorea tu uso de la API en el dashboard de OpenAI
- gpt-3.5-turbo es más económico para testing
- Configura límites de uso en OpenAI para evitar costos inesperados

### Limitaciones del MVP

- Solo un número de WhatsApp por usuario
- Sin respuestas multimedia (solo texto)
- Sin integración con otros servicios
- Métricas básicas

## Troubleshooting

### Error: "No se puede conectar a Supabase"
- Verifica que las variables de entorno estén correctas
- Verifica que el proyecto de Supabase esté activo

### Error: "QR Code no aparece"
- Verifica que whatsapp-web.js esté instalado correctamente
- Revisa los logs del servidor

### Error: "El bot no responde"
- Verifica que la API key de OpenAI sea válida
- Verifica que la configuración del bot esté activa
- Revisa los logs de mensajes en la tabla `message_logs`

## Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de OpenAI](https://platform.openai.com/docs)
- [whatsapp-web.js Guide](https://wwebjs.dev/)
- [shadcn/ui](https://ui.shadcn.com/)

## Soporte

Si encuentras problemas, revisa:
1. Los logs del servidor (`npm run dev`)
2. La consola del navegador
3. Los logs de Supabase (en el dashboard)
4. La tabla `message_logs` en Supabase

## Próximas Funcionalidades

- Múltiples números de WhatsApp
- Respuestas multimedia (imágenes, videos)
- Integraciones (Calendly, CRM)
- Analytics avanzados
- Templates por industria
- A/B testing de respuestas
