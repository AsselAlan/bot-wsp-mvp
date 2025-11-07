# WhatsApp Bot App - Bot Inteligente para Negocios

Plataforma completa para gestionar un bot de WhatsApp con inteligencia artificial, respuestas automáticas, sistema de pausa y detección de mensajes no respondidos.

## 🎯 Objetivo

Crear una plataforma que permita a cualquier negocio tener un asistente virtual inteligente en WhatsApp, con capacidad de aprendizaje y mejora continua basada en interacciones reales.

## ✨ Características Principales

### Bot Inteligente
- 🤖 **Integración con OpenAI** - Respuestas inteligentes usando GPT-3.5, GPT-4, GPT-4 Turbo, GPT-4o
- 🎯 **Respuestas Automáticas** - Sistema de respuestas basadas en palabras clave con prioridades
- 📝 **Contexto Personalizable** - Define la personalidad y rol del bot
- 🔄 **Historial de Conversación** - El bot recuerda los últimos mensajes para contexto

### Control Total
- ⏸️ **Sistema de Pausa** - Pausa/reanuda el bot desde el dashboard
- 📊 **Dashboard de Métricas** - Visualiza estadísticas en tiempo real
- 🔌 **Conexión WhatsApp** - Conecta tu WhatsApp mediante código QR

### Sistema de Aprendizaje
- 🚨 **Detección de Mensajes No Respondidos** - Identifica mensajes que el bot no pudo responder
- 📱 **Notificaciones por WhatsApp** - Recibe alertas cuando hay mensajes sin responder
- 📈 **Análisis de Tendencias** - Identifica los temas más consultados sin respuesta
- 🎓 **Mejora Continua** - Crea nuevas respuestas basadas en consultas reales

### Información del Negocio
- 🏢 **Datos del Negocio** - Nombre, horarios, dirección, teléfono
- 🌐 **Redes Sociales** - Facebook, Instagram, Twitter, WhatsApp Business, Website
- 📋 **Respuestas del Sistema** - Respuestas automáticas basadas en info del negocio

## 📚 Documentación

- **[SETUP.md](./SETUP.md)** - Guía completa de configuración e instalación
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Configuración de Supabase paso a paso
- **[FEATURES.md](./FEATURES.md)** - Detalle completo de todas las funcionalidades
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** - Plan de mejoras futuras
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - Estado actual del proyecto
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Solución de problemas comunes

## 🚀 Quick Start

### 1. Clonar e Instalar

```bash
npm install
```

### 2. Configurar Variables de Entorno

Copia `.env.example` a `.env.local` y completa:

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

Ver [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) para guía detallada.

### 4. Iniciar Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Stack Tecnológico

### Frontend
- **Next.js 16** - Framework React con App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Estilos
- **shadcn/ui** - Componentes UI
- **Lucide React** - Iconos

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
├── app/                           # Next.js App Router
│   ├── (auth)/                   # Rutas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/                # Dashboard principal
│   │   ├── page.tsx             # Métricas y estado
│   │   ├── connection/          # Conexión WhatsApp + QR
│   │   ├── config/              # Configuración del bot
│   │   └── unanswered/          # Mensajes sin responder
│   └── api/                      # API Routes
│       ├── whatsapp/            # Endpoints de WhatsApp
│       │   ├── connect/
│       │   ├── qr/
│       │   └── status/
│       └── bot/                 # Endpoints del bot
│           ├── config/
│           ├── pause/
│           ├── respond/
│           └── unanswered/
├── components/
│   ├── dashboard/               # Componentes del dashboard
│   │   ├── MetricsCard.tsx
│   │   ├── QRDisplay.tsx
│   │   ├── ConnectionStatus.tsx
│   │   └── BotStatusToggle.tsx
│   ├── config/                  # Componentes de configuración
│   │   ├── BotConfigForm.tsx
│   │   └── AutoResponsesList.tsx
│   ├── unanswered/             # Componentes de mensajes sin responder
│   │   └── UnansweredMessagesList.tsx
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── supabase/               # Clientes de Supabase
│   ├── whatsapp/               # Cliente de WhatsApp
│   │   ├── client.ts
│   │   └── messageHandler.ts
│   └── openai/                 # Cliente de OpenAI
│       └── client.ts
└── types/                      # TypeScript types
```

## 🗄️ Base de Datos

### Tablas Principales

- **users** - Información de usuarios (Supabase Auth)
- **whatsapp_connections** - Conexiones activas de WhatsApp
- **bot_configs** - Configuración del bot por usuario
  - Contexto principal
  - Información del negocio
  - Redes sociales
  - Configuración de OpenAI
  - Estado de pausa (is_active)
  - Número de notificaciones
- **auto_responses** (antes mini_tasks) - Respuestas automáticas
  - Respuestas del sistema (is_system: true)
  - Respuestas personalizadas (is_system: false)
- **chat_metrics** - Métricas diarias de chats
- **message_logs** - Registro completo de mensajes
- **unanswered_messages** - Mensajes que el bot no pudo responder

### Características

- ✅ Row Level Security (RLS) configurado
- ✅ Políticas de seguridad por usuario
- ✅ Índices para optimización
- ✅ Triggers para updated_at
- ✅ Funciones para métricas automáticas

## 🎨 Funcionalidades Implementadas

### 1. Autenticación y Seguridad
- Sistema completo de login/register con Supabase Auth
- Protección de rutas con middleware
- Row Level Security en base de datos

### 2. Conexión WhatsApp
- Generación de código QR para vincular WhatsApp
- Estado de conexión en tiempo real
- Persistencia de sesión
- Información del número conectado
- Desconexión manual

### 3. Dashboard Principal
- Métricas en tiempo real (chats totales, chats del día, respuestas del bot)
- Estado de conexión de WhatsApp
- Control de pausa/reanudación del bot
- Navegación intuitiva

### 4. Configuración del Bot

#### Contexto Principal
Define la personalidad y rol del bot:
```
Eres un asistente de una pizzería.
Debes ser amable y ayudar a tomar pedidos.
```

#### Información del Negocio
- Nombre del negocio
- Horarios de atención
- Dirección física
- Teléfono de contacto
- Redes sociales (Facebook, Instagram, Twitter, WhatsApp Business, Website)

#### Respuestas Automáticas
Dos tipos de respuestas:

**A) Respuestas del Sistema** (generadas automáticamente):
- Basadas en información del negocio
- Se crean/actualizan automáticamente
- No se pueden eliminar, solo editar
- Ejemplos: horario, dirección, teléfono, redes sociales

**B) Respuestas Personalizadas**:
- Creadas manualmente por el usuario
- Basadas en palabras clave con prioridades
- CRUD completo (crear, editar, eliminar)
- Ejemplos: precios, menú, promociones

#### Configuración OpenAI
- Selección de modelo (GPT-3.5, GPT-4, GPT-4 Turbo, GPT-4o, GPT-4o mini)
- API Key personalizada o global
- Temperatura del modelo (0-2, creatividad)
- Límite de 500 tokens por respuesta

### 5. Sistema de Pausa
- Pausar/reanudar el bot desde el dashboard
- Estado visual claro (Play/Pause icon)
- El bot sigue registrando mensajes cuando está pausado
- No responde mensajes mientras está pausado

### 6. Procesamiento Inteligente de Mensajes

#### Flujo de Procesamiento:
```
1. Mensaje recibido en WhatsApp
   ↓
2. Verificar si bot está pausado
   ↓ (si activo)
3. Buscar coincidencia en Respuestas Automáticas (por prioridad)
   ↓ (si no hay match)
4. Obtener historial de conversación (últimos 5 mensajes)
   ↓
5. Construir prompt con contexto del negocio
   ↓
6. Enviar a OpenAI
   ↓
7. Recibir respuesta
   ↓
8. Verificar si la respuesta es válida
   ↓ (si es válida)
9. Enviar respuesta al cliente
   ↓
10. Registrar en message_logs
    ↓
11. Actualizar chat_metrics
```

### 7. Sistema de Mensajes No Respondidos

Cuando el bot **NO** puede responder:
1. ✅ Guarda el mensaje en `unanswered_messages`
2. ✅ NO responde al cliente (silencio)
3. ✅ Envía notificación al número configurado por WhatsApp
4. ✅ Registra la razón (fuera de contexto, sin coincidencia, error)

**Dashboard de Mensajes Sin Responder:**
- Lista completa de mensajes no respondidos
- Filtros: Todos / No revisados
- Información: teléfono, mensaje, fecha, razón
- Estadísticas: total, % sin responder, más frecuentes
- Marcar como revisado
- Identificar patrones para crear nuevas respuestas

## 🔄 Flujo Completo de Funcionamiento

### Usuario envía: "¿Cuál es el horario?"

```
1. WhatsApp recibe mensaje
2. messageHandler.ts procesa
3. Verifica si bot está activo (is_active)
4. Busca en auto_responses:
   - Encuentra: trigger="horario" → response="Lun-Vie 9-18hs"
5. Envía respuesta inmediata
6. Registra en message_logs
7. Actualiza chat_metrics
```

### Usuario envía: "¿Tienen gluten free?"

```
1. WhatsApp recibe mensaje
2. messageHandler.ts procesa
3. Verifica si bot está activo
4. Busca en auto_responses → No encuentra match
5. Obtiene últimos 5 mensajes de contexto
6. Construye prompt:
   - "Eres asistente de [Pizzería]"
   - "Nombre: [nombre], Horario: [horario]..."
   - "Conversación previa: [últimos mensajes]"
   - "Usuario pregunta: ¿Tienen gluten free?"
7. OpenAI genera respuesta contextual
8. Verifica que la respuesta esté en contexto
9. Envía respuesta al usuario
10. Registra todo en BD
```

### Usuario envía: "¿Quién ganó el mundial?"

```
1. WhatsApp recibe mensaje
2. messageHandler.ts procesa
3. Verifica si bot está activo
4. Busca en auto_responses → No encuentra match
5. Envía a OpenAI con prompt estricto
6. OpenAI detecta que está fuera de contexto
7. Bot NO responde nada al usuario (silencio)
8. Guarda en unanswered_messages:
   - reason: "out_of_context"
9. Envía notificación al dueño:
   "🚨 Mensaje sin responder
   De: +549351123456
   Mensaje: ¿Quién ganó el mundial?
   Fecha: 07/11/2024 15:30"
10. Dashboard muestra en sección "Mensajes Sin Responder"
```

## 📊 Estado Actual del Proyecto

### ✅ Fase 1: Setup Base - COMPLETADA
- Proyecto Next.js 16 configurado
- Tailwind CSS 4 + shadcn/ui
- Estructura de carpetas
- Tipos TypeScript
- Configuración de Supabase
- Schema de base de datos completo

### ✅ Fase 2: Conexión WhatsApp - COMPLETADA
- Cliente WhatsApp con whatsapp-web.js
- Generación de QR code
- Página de conexión funcional
- Persistencia de sesión
- Estados en tiempo real

### ✅ Fase 3: Dashboard y Métricas - COMPLETADA
- Dashboard principal con métricas
- Componentes de visualización
- Integración con Supabase
- Actualización en tiempo real

### ✅ Fase 4: Configuración del Bot - COMPLETADA
- Formulario completo de configuración
- Sistema de respuestas automáticas
- Respuestas del sistema (auto-generadas)
- CRUD completo de respuestas personalizadas
- Configuración de OpenAI

### ✅ Fase 5: Integración OpenAI + Pausa + Mensajes Sin Responder - COMPLETADA
- Cliente de OpenAI funcional
- Procesador de mensajes con contexto
- Sistema de respuestas automáticas por prioridad
- Historial de conversación
- Sistema de pausa del bot
- Detección de mensajes no respondidos
- Notificaciones por WhatsApp
- Dashboard de mensajes sin responder
- Registro completo en BD
- Actualización de métricas

### 🔜 Próximas Mejoras (Roadmap)

Ver [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) para el roadmap completo.

**Próximas funcionalidades planificadas:**
- Sistema de plantillas por rubro (restaurante, clínica, e-commerce, etc.)
- Base de conocimiento avanzada (CSV, PDF, scraping web)
- Múltiples números de WhatsApp por usuario
- Respuestas multimedia (imágenes, videos, documentos)
- Integración con calendarios (Google Calendar, Calendly)
- Sistema de turnos y reservas
- Analytics avanzados y gráficas
- A/B testing de respuestas
- Exportación de datos

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
- **Políticas de acceso** por usuario (cada usuario solo ve sus datos)
- **API Keys encriptadas** en variables de entorno
- **Autenticación** manejada por Supabase Auth
- **Validaciones** en frontend y backend
- **Sanitización** de inputs del usuario
- **Notificaciones seguras** solo al número configurado

## 📈 Escalabilidad Futura

### Para Diferentes Clientes
- Templates por industria (pizzería, consultorio, e-commerce, hotel, academia)
- Sistema multi-tenant completo
- Planes de suscripción (Free, Pro, Enterprise)
- Límites por plan (mensajes/mes, números de WhatsApp, respuestas)

### Features Adicionales Planificadas
- Múltiples números de WhatsApp por usuario
- Respuestas multimedia (imágenes, videos, audio, documentos)
- Integraciones externas (CRM, ERP, calendarios)
- Sistema de turnos y reservas
- Catálogo de productos con búsqueda
- Proceso de checkout y pagos
- Chatbot multiidioma
- Analytics avanzados con gráficas
- Exportación de reportes
- API pública para integraciones

## 🐛 Troubleshooting

Ver [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) para solución de problemas comunes.

### Problemas Comunes

**No se conecta a Supabase:**
- Verifica las variables de entorno en `.env.local`

**QR Code no aparece:**
- Espera 10-20 segundos (Puppeteer inicializa)
- Verifica logs del servidor

**El bot no responde:**
1. Verifica que el bot esté activo (no pausado)
2. Verifica la API key de OpenAI
3. Revisa los logs en `message_logs`
4. Revisa mensajes sin responder en el dashboard

## 📚 Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [whatsapp-web.js Guide](https://wwebjs.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📝 Licencia

Este proyecto es privado y está en desarrollo activo.

---

## 👨‍💻 Desarrollo

### Contribuir
1. Lee [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
2. Revisa [PROJECT_STATUS.md](./PROJECT_STATUS.md)
3. Sigue las convenciones de código
4. Ejecuta `npm run type-check` antes de commit

### Estructura de Commits
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bugs
- `docs:` - Cambios en documentación
- `refactor:` - Refactorización de código
- `style:` - Cambios de formato
- `test:` - Añadir tests

---

**Estado:** 🟢 Fase 5 Completada - Bot Totalmente Funcional

**Última actualización:** Noviembre 2024

**Versión:** 1.0.0
