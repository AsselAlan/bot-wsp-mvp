# Funcionalidades - WhatsApp Bot App

**Versión:** 1.0.0
**Última actualización:** Noviembre 2024

Este documento detalla todas las funcionalidades implementadas en la aplicación.

---

## 📑 Índice

1. [Autenticación y Seguridad](#autenticación-y-seguridad)
2. [Conexión WhatsApp](#conexión-whatsapp)
3. [Dashboard](#dashboard)
4. [Configuración del Bot](#configuración-del-bot)
5. [Respuestas Automáticas](#respuestas-automáticas)
6. [Procesamiento de Mensajes](#procesamiento-de-mensajes)
7. [Sistema de Pausa](#sistema-de-pausa)
8. [Mensajes Sin Responder](#mensajes-sin-responder)
9. [Métricas y Analytics](#métricas-y-analytics)

---

## 🔐 Autenticación y Seguridad

### Registro y Login
- **Registro de usuarios** con email y contraseña
- **Verificación de email** para activar cuenta
- **Login seguro** con Supabase Auth
- **Sesiones persistentes** con cookies seguras
- **Logout** con limpieza de sesión

### Protección de Rutas
- **Middleware** que verifica autenticación
- Redirección automática a `/login` si no está autenticado
- Rutas protegidas:
  - `/dashboard/*` - Todas las rutas del dashboard
  - `/api/*` - Todos los endpoints de API

### Seguridad a Nivel de Base de Datos
- **Row Level Security (RLS)** en todas las tablas
- **Políticas de acceso** por usuario:
  - Cada usuario solo puede ver y editar SUS datos
  - Imposibilidad de acceder a datos de otros usuarios
- **API Keys seguras** en variables de entorno
- **Validación de inputs** en frontend y backend
- **Sanitización** de datos antes de guardar en BD

**Archivos relacionados:**
- `app/(auth)/login/page.tsx`
- `app/(auth)/register/page.tsx`
- `middleware.ts`
- `supabase/schema.sql` (políticas RLS)

---

## 🔌 Conexión WhatsApp

### Generación de Código QR
- Generación automática de código QR para vincular WhatsApp
- QR en formato base64 listo para mostrar en UI
- Actualización del QR cada 60 segundos si expira
- Página dedicada: `/dashboard/connection`

### Estados de Conexión
- **Desconectado** - No hay sesión activa
- **Generando QR** - Inicializando cliente
- **QR Mostrado** - Esperando escaneo
- **Conectando** - WhatsApp escaneado, autenticando
- **Conectado** - Sesión activa y lista

### Persistencia de Sesión
- **LocalAuth** de whatsapp-web.js
- Sesión guardada en carpeta `.wwebjs_auth/`
- No necesita reconectar después de reiniciar servidor
- Identificación por `userId`

### Información de Conexión
- Badge visual de estado (verde/rojo)
- Número de teléfono conectado
- Última vez que estuvo conectado
- Botón para desconectar manualmente

### Desconexión
- Botón "Desconectar WhatsApp"
- Confirmación antes de desconectar
- Limpieza de sesión del servidor
- Actualización de estado en tiempo real

**Componentes:**
- `components/dashboard/QRDisplay.tsx` - Generación y visualización de QR
- `components/dashboard/ConnectionStatus.tsx` - Estado y desconexión

**API Endpoints:**
- `POST /api/whatsapp/connect` - Iniciar conexión
- `GET /api/whatsapp/qr` - Obtener QR code
- `GET /api/whatsapp/status` - Ver estado
- `DELETE /api/whatsapp/status` - Desconectar
- `POST /api/whatsapp/send` - Enviar mensaje

---

## 📊 Dashboard

### Dashboard Principal (`/dashboard`)
El dashboard muestra una vista completa del estado del bot:

#### Métricas en Tiempo Real
- **Total de Chats** - Número total de conversaciones
- **Chats del Día** - Conversaciones del día actual
- **Respuestas del Bot** - Total de mensajes enviados por el bot

#### Estado de Conexión
- Badge indicando si WhatsApp está conectado o no
- Información del número conectado

#### Control de Pausa
- Toggle para pausar/reanudar el bot
- Estado visual claro (icono Play/Pause)
- Descripción del estado actual

#### Navegación
Sidebar con acceso a:
- Dashboard principal
- Conexión WhatsApp
- Configuración del bot
- Mensajes sin responder
- (Futuro: Analytics, logs, etc.)

**Componentes:**
- `app/dashboard/page.tsx` - Dashboard principal
- `components/dashboard/MetricsCard.tsx` - Card de métrica individual
- `components/dashboard/BotStatusToggle.tsx` - Control de pausa

---

## ⚙️ Configuración del Bot

### Página de Configuración (`/dashboard/config`)

#### 1. Contexto Principal
Define la personalidad y rol del bot.

**Campo:** Textarea multilínea
**Ejemplo:**
```
Eres un asistente virtual de "Pizzería Don Luigi".
Debes ser amigable, servicial y ayudar a los clientes con:
- Consultas sobre el menú
- Pedidos de pizza
- Horarios de atención
- Dirección y delivery

Mantén un tono cordial y profesional.
```

#### 2. Información del Negocio
Datos básicos del negocio que el bot utilizará en sus respuestas.

**Campos:**
- **Nombre del negocio** - Ej: "Pizzería Don Luigi"
- **Horarios de atención** - Ej: "Lunes a Viernes 10:00 - 22:00"
- **Dirección física** - Ej: "Av. Libertador 1234, CABA"
- **Teléfono de contacto** - Ej: "+54 9 11 2345-6789"

#### 3. Redes Sociales
Links a perfiles sociales del negocio.

**Campos:**
- **Facebook** - URL del perfil
- **Instagram** - URL del perfil
- **Twitter** - URL del perfil
- **WhatsApp Business** - Número con código internacional
- **Website** - URL del sitio web

**Uso:** El bot puede compartir estos links cuando le preguntan por redes sociales.

#### 4. Configuración de OpenAI

**Modelo de IA:**
Selecciona el modelo a usar:
- `gpt-3.5-turbo` - Más rápido y económico
- `gpt-4` - Más preciso y contextual
- `gpt-4-turbo` - Balance entre velocidad y calidad
- `gpt-4o` - Última versión optimizada
- `gpt-4o-mini` - Versión mini optimizada

**API Key:**
- Campo opcional
- Si no se proporciona, usa la API key global del `.env`
- Si se proporciona, usa esta key en lugar de la global
- Almacenada de forma segura

**Temperatura (0-2):**
- Controla la "creatividad" del bot
- `0` - Respuestas muy predecibles y conservadoras
- `1` - Balance (recomendado)
- `2` - Respuestas más creativas y variadas

**Límite de tokens:** 500 tokens por respuesta (no configurable por ahora)

#### 5. Notificaciones

**Número para notificaciones:**
- Número de WhatsApp donde el dueño recibirá alertas
- Formato: +54 9 351 123-4567

**Activar notificaciones:**
- Toggle para activar/desactivar
- Si está activo, recibe alertas de mensajes sin responder

#### 6. Estado del Bot

**is_active (Pausa):**
- Controla si el bot responde mensajes o no
- También se puede controlar desde el dashboard principal
- Cuando está pausado:
  - Bot NO responde mensajes
  - Mensajes se siguen registrando en BD
  - Métricas se siguen actualizando

**API Endpoints:**
- `GET /api/bot/config` - Obtener configuración actual
- `POST /api/bot/config` - Guardar configuración
- `PUT /api/bot/config` - Actualizar configuración

**Componente:**
- `components/config/BotConfigForm.tsx`

---

## 🎯 Respuestas Automáticas

### Tipos de Respuestas

La aplicación maneja dos tipos de respuestas automáticas:

#### A) Respuestas del Sistema (Auto-generadas)
Respuestas creadas automáticamente basadas en la información del negocio.

**Características:**
- Se crean/actualizan al guardar la configuración del bot
- Basadas en campos de "Información del Negocio"
- NO se pueden eliminar
- SÍ se pueden editar (keywords y texto de respuesta)
- Tienen badge "Sistema" en la UI
- Campo `is_system: true` en BD

**Respuestas del sistema incluidas:**

1. **Horario:**
   - Keywords: `horario|hora|abierto|cerrado|cuando`
   - Respuesta: Valor del campo `business_info.hours`

2. **Dirección:**
   - Keywords: `direccion|ubicacion|donde|como llego`
   - Respuesta: Valor del campo `business_info.address`

3. **Teléfono:**
   - Keywords: `telefono|contacto|llamar|numero`
   - Respuesta: Valor del campo `business_info.phone`

4. **Redes Sociales:**
   - Keywords: `facebook|instagram|redes|seguir`
   - Respuesta: Links a redes sociales configuradas

5. **Nombre:**
   - Keywords: `nombre|quien|quienes son`
   - Respuesta: Valor del campo `business_info.name`

#### B) Respuestas Personalizadas (Creadas por el usuario)
Respuestas creadas manualmente por el usuario para casos específicos.

**Características:**
- CRUD completo: Crear, Leer, Actualizar, Eliminar
- Campo `is_system: false` en BD
- Usuario define:
  - **Keyword/trigger** - Palabra clave que activa la respuesta
  - **Respuesta** - Texto que el bot enviará
  - **Prioridad (1-10)** - Orden de evaluación (1 = mayor prioridad)

**Ejemplos de respuestas personalizadas:**
- Keyword: `menu|carta|platos` → Respuesta: Link a menú PDF
- Keyword: `precio|costo|cuanto` → Respuesta: Lista de precios
- Keyword: `delivery|envio` → Respuesta: Info sobre delivery

### UI de Respuestas Automáticas

**Tabs:**
1. **"Info del Negocio"** - Respuestas del sistema (solo editar)
2. **"Personalizadas"** - Respuestas del usuario (CRUD completo)

**Funciones:**
- Crear nueva respuesta personalizada
- Editar respuesta (sistema o personalizada)
- Eliminar respuesta (solo personalizadas)
- Ver lista de todas las respuestas
- Ver keywords activas

**API Endpoints:**
- `GET /api/bot/mini-tasks` - Listar respuestas
- `POST /api/bot/mini-tasks` - Crear respuesta personalizada
- `PUT /api/bot/mini-tasks/:id` - Actualizar respuesta
- `DELETE /api/bot/mini-tasks/:id` - Eliminar respuesta (solo personalizadas)

**Componente:**
- `components/config/AutoResponsesList.tsx`

**Tabla en BD:** `mini_tasks` (nombre original, ahora usado para auto_responses)

---

## 🤖 Procesamiento de Mensajes

### Flujo Completo de Procesamiento

```
1. Usuario envía mensaje a WhatsApp
   ↓
2. whatsapp-web.js recibe evento 'message'
   ↓
3. handleIncomingMessage() se ejecuta
   ↓
4. Verifica si el mensaje es propio (fromMe)
   ↓ (Si es propio, ignora)
5. Verifica si el bot está pausado (is_active)
   ↓ (Si pausado, registra pero NO responde)
6. Obtiene configuración del bot y respuestas automáticas
   ↓
7. generateAIResponse() busca coincidencia en respuestas automáticas
   ↓ (Por orden de prioridad)
8. Si hay match → Devuelve respuesta inmediata
   ↓ (Si no hay match)
9. Obtiene historial de conversación (últimos 5 mensajes)
   ↓
10. Construye prompt con:
    - Contexto principal
    - Información del negocio
    - Redes sociales
    - Historial de conversación
    - Mensaje actual
    ↓
11. Envía a OpenAI
    ↓
12. Recibe respuesta de OpenAI
    ↓
13. Valida que la respuesta esté en contexto
    ↓ (Si está fuera de contexto o no puede responder)
14. Guarda en unanswered_messages
    NO responde al cliente
    Envía notificación al dueño
    ↓ (Si tiene respuesta válida)
15. Envía respuesta al usuario (message.reply())
    ↓
16. Registra en message_logs
    ↓
17. Actualiza chat_metrics
```

### Detección de Respuestas Automáticas

**Función:** `checkMiniTasks()` en `lib/openai/client.ts`

**Proceso:**
1. Normaliza el mensaje del usuario (lowercase, sin acentos)
2. Ordena respuestas automáticas por prioridad (1 = más alta)
3. Para cada respuesta:
   - Obtiene keywords (separadas por `|`)
   - Busca si alguna keyword está presente en el mensaje
4. Si encuentra match → Devuelve respuesta inmediatamente
5. Si no encuentra → Retorna null (proceder con OpenAI)

### Generación de Respuestas con IA

**Función:** `generateAIResponse()` en `lib/openai/client.ts`

**Parámetros:**
- Mensaje del usuario
- Configuración del bot
- Respuestas automáticas
- Historial de conversación (opcional)

**Proceso:**
1. Primero intenta buscar en respuestas automáticas
2. Si no hay match, construye prompt con contexto completo
3. Envía a OpenAI con configuración (modelo, temperatura, max_tokens)
4. Recibe respuesta
5. Valida que sea una respuesta útil y en contexto
6. Retorna respuesta o null (si no pudo responder)

### Construcción del Prompt

**Función:** `buildSystemPrompt()` en `lib/openai/client.ts`

**Estructura del prompt:**
```
Eres un asistente virtual de [nombre_negocio].

[Contexto principal definido por el usuario]

Información del negocio:
- Nombre: [nombre]
- Horarios: [horarios]
- Dirección: [dirección]
- Teléfono: [teléfono]
- Redes sociales: [links]

Instrucciones:
- Sé conversacional pero mantente en contexto del negocio
- SOLO responde preguntas sobre [nombre_negocio] y sus servicios
- Si te preguntan algo totalmente fuera de contexto, NO respondas
- Si no tienes información específica, admítelo y sugiere contacto directo
- Usa la información del negocio en tus respuestas

[Si hay historial de conversación]
Conversación previa:
[Últimos 5 mensajes]
```

### Historial de Conversación

**Función:** `getConversationHistory()` en `lib/whatsapp/messageHandler.ts`

**Características:**
- Obtiene últimos 5 mensajes entre el bot y el usuario
- Incluye mensaje del usuario y respuesta del bot
- Ordenados del más antiguo al más reciente
- Usado para dar contexto a OpenAI

**Ejemplo de historial:**
```
Usuario: ¿Tienen delivery?
Bot: Sí, hacemos delivery a toda CABA. El costo varía según la zona.

Usuario: ¿Cuánto cuesta a Palermo?
Bot: A Palermo el delivery cuesta $500.

Usuario: ¿Cuánto demora?
[Este mensaje actual necesita contexto de los anteriores]
```

### Manejo de Mensajes

**Archivo principal:** `lib/whatsapp/messageHandler.ts`

**Función:** `handleIncomingMessage(message, client, config)`

**Flujo interno:**
1. Ignora si es mensaje propio
2. Verifica pausa del bot
3. Obtiene texto del mensaje
4. Obtiene config y respuestas automáticas de BD
5. Llama a `generateAIResponse()`
6. Si tiene respuesta válida:
   - Envía al usuario
   - Registra en `message_logs`
   - Actualiza `chat_metrics`
7. Si NO puede responder:
   - Guarda en `unanswered_messages`
   - Envía notificación al dueño (si está activado)
   - NO responde al cliente (silencio)
8. Maneja errores y excepciones

---

## ⏸️ Sistema de Pausa

### Funcionalidad
Permite pausar y reanudar el bot sin desconectar WhatsApp.

### Estados
- **Activo (is_active: true)** - Bot responde mensajes normalmente
- **Pausado (is_active: false)** - Bot NO responde, pero sigue registrando

### Comportamiento cuando está Pausado
- ✅ Mensajes se reciben normalmente
- ✅ Mensajes se registran en `message_logs`
- ✅ Métricas se actualizan
- ❌ Bot NO envía respuestas automáticas
- ❌ Bot NO consulta a OpenAI
- ❌ Bot NO envía ninguna respuesta al cliente

### Controles de Pausa

#### 1. Desde el Dashboard Principal
**Componente:** `BotStatusToggle` en `/dashboard`

**Visualización:**
- Card con título "Estado del Bot"
- Icono Play (pausado) / Pause (activo)
- Switch toggle
- Descripción del estado actual
- Tip para el usuario

**Interacción:**
- Toggle el switch para pausar/reanudar
- Cambio instantáneo con feedback visual
- Actualización de estado en BD

#### 2. Desde la Configuración
**Campo:** `is_active` en formulario de configuración

**Uso:** Al guardar la configuración, se actualiza el estado de pausa.

### API Endpoints

**GET `/api/bot/pause`** - Obtener estado actual
```json
{
  "is_active": true
}
```

**POST `/api/bot/pause`** - Cambiar estado
```json
// Request
{
  "is_active": false
}

// Response
{
  "success": true,
  "is_active": false,
  "message": "Bot pausado exitosamente"
}
```

**Componente:**
- `components/dashboard/BotStatusToggle.tsx`

**Campo en BD:** `bot_configs.is_active`

---

## 🚨 Mensajes Sin Responder

### Funcionalidad
Sistema que detecta y gestiona mensajes que el bot no pudo responder.

### Cuándo se Considera "No Respondido"

Un mensaje se guarda como "sin responder" cuando:
1. No hay coincidencia en respuestas automáticas
2. OpenAI no genera respuesta (error, timeout, etc.)
3. OpenAI detecta que está fuera del contexto del negocio
4. El bot está pausado (opcional, configurable)

### Proceso Automático

**Cuando el bot NO puede responder:**

1. **Guarda en BD:**
   - Tabla: `unanswered_messages`
   - Datos: chat_id, sender_number, message_text, reason, timestamp
   - Estado inicial: `is_reviewed: false`

2. **NO responde al cliente:**
   - El bot permanece en silencio
   - No envía ningún mensaje de "no entendí"
   - Cliente queda esperando (puede volver a intentar)

3. **Envía notificación al dueño:**
   - Solo si está activado (`enable_unanswered_notifications: true`)
   - Solo si hay número configurado (`notification_number`)
   - Mensaje por WhatsApp al número configurado:

```
🚨 Mensaje sin responder

De: +54 9 351 123-4567
Mensaje: ¿Tienen estacionamiento?
Fecha: 07/11/2024 15:30

Revisa el dashboard para crear una respuesta.
```

### Razones de No Respuesta

**Valores del campo `reason`:**
- `out_of_context` - Pregunta fuera del contexto del negocio
- `no_match` - No hay respuesta automática ni OpenAI generó respuesta
- `api_error` - Error al consultar OpenAI
- `paused` - Bot está pausado (opcional)

### Dashboard de Mensajes Sin Responder

**Página:** `/dashboard/unanswered`

**Visualización:**

Tabla con columnas:
- **Teléfono** - Número del remitente
- **Mensaje** - Texto del mensaje
- **Fecha** - Timestamp
- **Razón** - Por qué no se respondió
- **Estado** - Revisado / No revisado
- **Acciones** - Marcar como revisado

**Filtros:**
- Todos los mensajes
- Solo no revisados
- Por fecha (últimos 7 días, últimos 30 días, etc.)

**Estadísticas:**
- Total de mensajes sin responder
- % de mensajes sin responder vs total
- Temas más consultados sin respuesta
- Tendencias (gráfica opcional)

**Acciones disponibles:**
- **Marcar como revisado** - Cambia `is_reviewed: true`
- **Ver historial completo** - Ver conversación completa del usuario
- **Crear respuesta** - (Futuro) Crear respuesta automática desde aquí

### API Endpoints

**GET `/api/bot/unanswered`** - Listar mensajes
```json
{
  "messages": [
    {
      "id": "uuid",
      "sender_number": "+5493511234567",
      "message_text": "¿Tienen estacionamiento?",
      "reason": "no_match",
      "created_at": "2024-11-07T15:30:00Z",
      "is_reviewed": false
    }
  ],
  "stats": {
    "total": 15,
    "unreviewedCount": 5,
    "percentageUnanswered": 3.2
  }
}
```

**POST `/api/bot/unanswered/:id/review`** - Marcar como revisado
```json
// Response
{
  "success": true,
  "message": "Mensaje marcado como revisado"
}
```

**Componente:**
- `components/unanswered/UnansweredMessagesList.tsx`

**Tabla en BD:** `unanswered_messages`

### Notificaciones

**Función:** `sendUnansweredNotification()` en `lib/whatsapp/messageHandler.ts`

**Parámetros:**
- Número del remitente
- Mensaje original
- Cliente de WhatsApp

**Proceso:**
1. Obtiene `notification_number` de `bot_configs`
2. Verifica que `enable_unanswered_notifications` esté activo
3. Construye mensaje de notificación
4. Envía mensaje por WhatsApp usando `sendWhatsAppMessage()`

---

## 📈 Métricas y Analytics

### Métricas Básicas (Implementadas)

**Dashboard principal muestra:**
1. **Total de Chats** - Número total de conversaciones únicas
2. **Chats del Día** - Conversaciones del día actual
3. **Respuestas del Bot** - Total de mensajes enviados por el bot

**Actualización:**
- En tiempo real al enviar/recibir mensajes
- Función `incrementChatMetrics()` en Supabase
- Tabla `chat_metrics` con registro diario

### Registro de Mensajes

**Tabla:** `message_logs`

**Campos:**
- `user_id` - Usuario dueño del bot
- `chat_id` - ID único del chat
- `sender_number` - Número del remitente
- `message_text` - Mensaje original
- `bot_response` - Respuesta del bot (puede ser null)
- `response_type` - "mini_task", "ai_generated", "error"
- `timestamp` - Fecha y hora

**Uso:**
- Auditoría completa de mensajes
- Análisis de conversaciones
- Historial para contexto
- Debugging

### Chat Metrics

**Tabla:** `chat_metrics`

**Campos:**
- `user_id` - Usuario dueño del bot
- `date` - Fecha (sin hora, para agrupar por día)
- `total_chats` - Total de chats únicos del día
- `bot_responses` - Total de respuestas enviadas por el bot
- `mini_task_responses` - Respuestas automáticas usadas
- `ai_responses` - Respuestas generadas por OpenAI
- `unanswered_messages` - Mensajes que no se pudieron responder

**Actualización:**
- Automática al procesar mensajes
- Función `increment_chat_metrics()` en Supabase (SQL)
- Incrementa contadores del día actual

### API de Métricas

**GET `/api/metrics`** - Obtener métricas

```json
{
  "totalChats": 150,
  "chatsToday": 12,
  "botResponses": 320,
  "miniTaskResponses": 85,
  "aiResponses": 210,
  "unansweredCount": 25
}
```

### Métricas Futuras (Planificadas)

Ver [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Fase 9: Analytics Avanzados

- Gráficas de actividad (mensajes por hora, por día)
- Tasa de respuesta automática vs IA
- Tiempo promedio de respuesta
- Satisfacción del cliente
- Exportación de reportes (CSV, PDF)

---

## 📊 Resumen de Arquitectura

### Stack Tecnológico

**Frontend:**
- Next.js 16 con App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL)
- Supabase Auth

**Integraciones:**
- whatsapp-web.js - Conexión WhatsApp
- OpenAI API - Inteligencia artificial
- QRCode - Generación de QR

### Tablas de Base de Datos

1. **users** - Usuarios autenticados (Supabase Auth)
2. **whatsapp_connections** - Conexiones de WhatsApp
3. **bot_configs** - Configuración del bot
4. **mini_tasks** - Respuestas automáticas (sistema + personalizadas)
5. **chat_metrics** - Métricas diarias
6. **message_logs** - Registro completo de mensajes
7. **unanswered_messages** - Mensajes sin responder

### Flujo de Datos

```
Usuario → WhatsApp → whatsapp-web.js → messageHandler.ts
                                              ↓
                                    Respuestas Automáticas
                                              ↓ (si no hay match)
                                         OpenAI API
                                              ↓
                                    Respuesta generada
                                              ↓
                              Enviar al usuario + Registrar en BD
```

---

## 🚀 Estado de Implementación

**Versión Actual:** 1.0.0
**Fase Completada:** 5 / 5 (100%)

**Todas las funcionalidades descritas en este documento están completamente implementadas y funcionando.**

Ver [PROJECT_STATUS.md](./PROJECT_STATUS.md) para detalles técnicos de implementación.

Ver [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) para roadmap de mejoras futuras.

---

**Última actualización:** Noviembre 2024
