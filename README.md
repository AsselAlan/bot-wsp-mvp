# WhatsApp Bot App - MVP

Aplicación web para gestionar un bot de WhatsApp con configuración personalizable, integración con OpenAI y métricas en tiempo real.

## 🎯 Objetivo

Crear una plataforma que permita a cualquier negocio tener un asistente virtual en WhatsApp sin necesidad de conocimientos técnicos avanzados.

## 📚 Documentación

- **[SETUP.md](./SETUP.md)** - Guía completa de configuración e instalación
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - Plan detallado de implementación por fases
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Estado actual del proyecto y próximos pasos

## 🚀 Quick Start

### 1. Clonar e Instalar

```bash
npm install
```

### 2. Configurar Variables de Entorno

Copia `.env.example` a `.env.local` y completa las variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
OPENAI_API_KEY=tu-openai-api-key
```

### 3. Configurar Base de Datos

1. Ve a tu proyecto en [Supabase](https://supabase.com)
2. Abre el **SQL Editor**
3. Ejecuta el contenido de `supabase/schema.sql`

### 4. Iniciar Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Stack Tecnológico

### Frontend
- **Next.js 14** - Framework React con App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilos
- **shadcn/ui** - Componentes UI

### Backend
- **Supabase** - Base de datos PostgreSQL + Auth + Realtime
- **Next.js API Routes** - Endpoints serverless

### Integraciones
- **whatsapp-web.js** - Conexión con WhatsApp
- **OpenAI API** - Inteligencia artificial para el bot
- **QRCode** - Autenticación de WhatsApp

## 🏗️ Arquitectura

```
whatsapp-bot-app/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Rutas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/           # Dashboard principal
│   │   ├── page.tsx        # Métricas y estado
│   │   ├── connection/     # Conexión WhatsApp + QR
│   │   └── config/         # Configuración del bot
│   └── api/                # API Routes
│       ├── whatsapp/       # Endpoints de WhatsApp
│       └── bot/            # Endpoints del bot
├── components/
│   ├── dashboard/          # Componentes del dashboard
│   ├── config/             # Componentes de configuración
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── supabase/          # Clientes de Supabase
│   ├── whatsapp/          # Cliente de WhatsApp
│   └── openai/            # Cliente de OpenAI
└── types/                 # TypeScript types
```

## 🗄️ Base de Datos

### Tablas

- **users** - Información de usuarios
- **whatsapp_connections** - Conexiones de WhatsApp
- **bot_configs** - Configuración del bot
- **mini_tasks** - Tareas automáticas basadas en keywords
- **chat_metrics** - Métricas diarias de chats
- **message_logs** - Registro completo de mensajes

### Características

- ✅ Row Level Security (RLS) configurado
- ✅ Políticas de seguridad por usuario
- ✅ Índices para optimización
- ✅ Triggers para updated_at
- ✅ Funciones para métricas automáticas

## 🎨 Funcionalidades del MVP

### 1. Dashboard Principal
- Métricas en tiempo real
- Estado de conexión de WhatsApp
- Total de chats y respuestas del bot

### 2. Conexión WhatsApp
- Generar código QR para vincular
- Ver estado de conexión
- Información del número conectado
- Desconectar WhatsApp

### 3. Configuración del Bot

#### Contexto Principal
Define la personalidad y rol del bot:
```
Eres un asistente de una pizzería.
Debes ser amable y ayudar a tomar pedidos.
```

#### Información del Negocio
- Nombre del negocio
- Horarios de atención
- Dirección
- Teléfono de contacto

#### Mini Tareas
Respuestas automáticas basadas en palabras clave:
- **Trigger:** "ubicación" → Respuesta: "Estamos en Calle 123..."
- **Trigger:** "horario" → Respuesta: "Atendemos de 10am a 10pm..."

#### Configuración OpenAI
- Selección de modelo (GPT-3.5 / GPT-4)
- API Key personalizada
- Temperatura del modelo (creatividad)

## 🔄 Flujo de Funcionamiento

### Conexión
```
Usuario → Genera QR → Escanea con WhatsApp → Sesión guardada en Supabase
```

### Procesamiento de Mensajes
```
Mensaje WhatsApp
    ↓
Verificar Mini Tareas
    ↓ (No match)
Construir Prompt (Contexto + Business Info + Mensaje)
    ↓
OpenAI API
    ↓
Respuesta enviada por WhatsApp
    ↓
Log guardado + Métricas actualizadas
```

## 📊 Estado Actual del Proyecto

### ✅ Fase 1: Setup Base - COMPLETADA

- [x] Proyecto Next.js configurado
- [x] Tailwind CSS + shadcn/ui
- [x] Estructura de carpetas
- [x] Tipos TypeScript
- [x] Configuración de Supabase
- [x] Schema de base de datos
- [x] Documentación completa

### 🚧 Próximas Fases

- **Fase 2:** Conexión WhatsApp
- **Fase 3:** Dashboard y Métricas
- **Fase 4:** Configuración del Bot
- **Fase 5:** Integración OpenAI
- **Fase 6:** Testing y Deploy

Ver [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) para detalles.

## 🛠️ Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build            # Build para producción
npm run start            # Servidor de producción

# Calidad de Código
npm run lint             # Ejecutar ESLint
npm run type-check       # Verificar tipos TypeScript

# shadcn/ui
npx shadcn@latest add [component]  # Añadir componentes
```

## 🔐 Seguridad

- **RLS (Row Level Security)** en todas las tablas
- **Políticas de acceso** por usuario
- **API Keys encriptadas** en base de datos
- **Autenticación** manejada por Supabase Auth
- **Variables de entorno** para secrets

## 📈 Escalabilidad Futura

### Para Diferentes Clientes
- Templates por industria (pizzería, consultorio, e-commerce)
- Sistema multi-tenant
- Planes de suscripción (Free, Pro, Enterprise)

### Features Adicionales
- Múltiples números de WhatsApp
- Respuestas multimedia (imágenes, videos)
- Integraciones (CRM, calendarios)
- Analytics avanzados
- A/B testing de respuestas
- Horarios de disponibilidad
- Multi-agentes

## 🐛 Troubleshooting

### No se conecta a Supabase
Verifica que las variables de entorno en `.env.local` sean correctas.

### QR Code no aparece
Verifica que `whatsapp-web.js` esté instalado correctamente.

### El bot no responde
1. Verifica la API key de OpenAI
2. Verifica que la configuración del bot esté activa
3. Revisa los logs en `message_logs`

Ver [SETUP.md](./SETUP.md) para más soluciones.

## 📚 Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [whatsapp-web.js Guide](https://wwebjs.dev/)
- [shadcn/ui](https://ui.shadcn.com/)

## 📝 Licencia

Este proyecto es privado y está en desarrollo.

---

## 👨‍💻 Desarrollo

### Contribuir
1. Lee [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
2. Revisa [PROJECT_STATUS.md](./PROJECT_STATUS.md)
3. Sigue las convenciones de código
4. Ejecuta `npm run type-check` antes de commit

### Estructura de Branches
- `main` - Producción
- `develop` - Desarrollo
- `feature/*` - Nuevas funcionalidades
- `fix/*` - Correcciones

---

**Estado:** 🟢 Fase 1 Completada - Listo para Fase 2

**Última actualización:** Noviembre 2025
