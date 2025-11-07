# Plan de Implementación Detallado

## Estado Actual: Fase 1 Completada ✅

### Lo que ya está configurado:
- ✅ Proyecto Next.js 14 con TypeScript
- ✅ Tailwind CSS configurado
- ✅ shadcn/ui configurado
- ✅ Estructura de carpetas completa
- ✅ Tipos TypeScript definidos
- ✅ Configuración de Supabase (cliente y servidor)
- ✅ Schema SQL completo con RLS policies
- ✅ Variables de entorno (.env.example)

---

## Fase 2: Conexión WhatsApp (Próximo Paso)

### Archivos a crear:

#### 1. `lib/whatsapp/client.ts`
```typescript
// Cliente de WhatsApp usando whatsapp-web.js
// - Inicializar cliente
// - Generar QR code
// - Manejar eventos de conexión
// - Guardar/restaurar sesión
```

#### 2. `lib/whatsapp/messageHandler.ts`
```typescript
// Procesador de mensajes entrantes
// - Detectar nuevo mensaje
// - Verificar mini tareas
// - Enviar a OpenAI si es necesario
// - Registrar en message_logs
```

#### 3. `app/api/whatsapp/connect/route.ts`
```typescript
// POST: Iniciar conexión de WhatsApp
// - Crear cliente
// - Generar QR
// - Retornar session ID
```

#### 4. `app/api/whatsapp/qr/route.ts`
```typescript
// GET: Obtener QR code actual
// - Retornar QR en base64
// - Verificar si ya está conectado
```

#### 5. `app/api/whatsapp/status/route.ts`
```typescript
// GET: Estado de conexión
// - Verificar si está conectado
// - Retornar número de teléfono
// - Retornar última conexión
```

#### 6. `app/dashboard/connection/page.tsx`
```typescript
// Página de conexión WhatsApp
// - Botón para generar QR
// - Mostrar QR code
// - Mostrar estado de conexión
// - Botón para desconectar
```

#### 7. `components/dashboard/QRDisplay.tsx`
```typescript
// Componente para mostrar QR
// - Mostrar QR en base64
// - Polling para actualizar estado
// - Mensaje de éxito al conectar
```

#### 8. `components/dashboard/ConnectionStatus.tsx`
```typescript
// Componente de estado de conexión
// - Indicador visual (conectado/desconectado)
// - Número de teléfono
// - Última conexión
```

### Tareas específicas:

1. **Implementar cliente de WhatsApp**
   - Usar `whatsapp-web.js`
   - Manejar autenticación con QR
   - Guardar sesión en Supabase

2. **Crear API endpoints**
   - `/api/whatsapp/connect` - Iniciar conexión
   - `/api/whatsapp/qr` - Obtener QR
   - `/api/whatsapp/status` - Estado

3. **Crear página de conexión**
   - UI para escanear QR
   - Polling para verificar estado
   - Manejo de errores

---

## Fase 3: Dashboard y Métricas

### Archivos a crear:

#### 1. `app/dashboard/page.tsx`
```typescript
// Dashboard principal
// - Mostrar métricas del día
// - Mostrar estado de conexión
// - Gráfica simple (opcional)
```

#### 2. `components/dashboard/MetricsCard.tsx`
```typescript
// Card de métrica individual
// - Título
// - Valor numérico
// - Icono
// - Tendencia (opcional)
```

#### 3. `app/api/metrics/route.ts`
```typescript
// GET: Obtener métricas del usuario
// - Total de chats
// - Chats del día
// - Respuestas del bot
```

### Tareas específicas:

1. **Crear queries de métricas**
   - Obtener métricas diarias de Supabase
   - Calcular totales

2. **Implementar dashboard**
   - Cards de métricas
   - Actualización en tiempo real (opcional)

3. **Añadir iconos**
   - Usar `lucide-react`
   - Icons para cada métrica

---

## Fase 4: Configuración del Bot

### Archivos a crear:

#### 1. `app/dashboard/config/page.tsx`
```typescript
// Página de configuración
// - Formulario de contexto
// - Formulario de business info
// - Lista de mini tareas
// - Config de OpenAI
```

#### 2. `components/config/BotConfigForm.tsx`
```typescript
// Formulario principal
// - Textarea para contexto
// - Inputs para business info
// - Select para modelo OpenAI
// - Input seguro para API key
// - Slider para temperatura
```

#### 3. `components/config/MiniTasksList.tsx`
```typescript
// Lista de mini tareas
// - Tabla de tareas
// - Botón para añadir
// - Editar/eliminar tarea
// - Toggle activo/inactivo
```

#### 4. `components/config/MiniTaskItem.tsx`
```typescript
// Item individual de mini tarea
// - Trigger keyword
// - Response text
// - Prioridad
// - Acciones (editar, eliminar)
```

#### 5. `app/api/bot/config/route.ts`
```typescript
// GET: Obtener configuración actual
// POST: Crear nueva configuración
// PUT: Actualizar configuración
```

#### 6. `app/api/bot/mini-tasks/route.ts`
```typescript
// GET: Listar mini tareas
// POST: Crear mini tarea
// PUT: Actualizar mini tarea
// DELETE: Eliminar mini tarea
```

### Tareas específicas:

1. **Implementar CRUD de configuración**
   - Crear/actualizar config
   - Validaciones de formulario
   - Encriptar API key de OpenAI

2. **Implementar CRUD de mini tareas**
   - Crear/editar/eliminar
   - Ordenar por prioridad
   - Activar/desactivar

3. **Crear formularios**
   - Usar react-hook-form (opcional)
   - Validaciones
   - Manejo de errores

---

## Fase 5: Integración OpenAI

### Archivos a crear:

#### 1. `lib/openai/client.ts`
```typescript
// Cliente de OpenAI
// - Inicializar con API key
// - Función para generar respuesta
// - Manejar errores
```

#### 2. `lib/whatsapp/messageHandler.ts` (actualizar)
```typescript
// Añadir lógica de procesamiento:
// 1. Recibir mensaje
// 2. Verificar mini tareas
// 3. Si no hay match, enviar a OpenAI
// 4. Construir prompt con contexto
// 5. Obtener respuesta
// 6. Enviar respuesta por WhatsApp
// 7. Guardar log
// 8. Actualizar métricas
```

#### 3. `app/api/bot/respond/route.ts`
```typescript
// POST: Procesar mensaje y generar respuesta
// - Recibir mensaje
// - Buscar configuración del usuario
// - Verificar mini tareas
// - Generar respuesta con OpenAI
// - Retornar respuesta
```

#### 4. `app/api/whatsapp/webhook/route.ts`
```typescript
// POST: Webhook para mensajes de WhatsApp
// - Recibir mensaje entrante
// - Procesar con messageHandler
// - Actualizar métricas
```

### Tareas específicas:

1. **Implementar cliente de OpenAI**
   - Configurar OpenAI SDK
   - Función para generar respuestas
   - Manejo de rate limits

2. **Implementar procesador de mensajes**
   - Lógica de mini tareas
   - Construcción de prompts
   - Integración con OpenAI

3. **Implementar sistema de logs**
   - Guardar todos los mensajes
   - Guardar respuestas del bot
   - Actualizar métricas

---

## Fase 6: Testing y Refinamiento

### Tareas:

1. **Testing Manual**
   - Probar flujo completo de conexión
   - Probar envío y recepción de mensajes
   - Probar mini tareas
   - Probar configuración

2. **Manejo de Errores**
   - Error boundaries en React
   - Try-catch en API routes
   - Mensajes de error amigables

3. **UX Improvements**
   - Loading states
   - Toast notifications
   - Animaciones suaves
   - Diseño responsive

4. **Deploy**
   - Deploy en Vercel
   - Configurar variables de entorno
   - Configurar dominios

---

## Componentes shadcn/ui a instalar

```bash
# Instalar componentes necesarios
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add toast
npx shadcn@latest add switch
npx shadcn@latest add slider
npx shadcn@latest add form
```

---

## Orden de Implementación Recomendado

### Semana 1:
- **Día 1-2:** Fase 2 - Conexión WhatsApp
  - Implementar cliente WhatsApp
  - Crear API endpoints
  - Crear página de conexión

- **Día 3:** Fase 3 - Dashboard
  - Crear dashboard principal
  - Implementar métricas
  - Diseñar UI

- **Día 4-5:** Fase 4 - Configuración
  - Formulario de configuración
  - CRUD de mini tareas
  - Validaciones

### Semana 2:
- **Día 6-7:** Fase 5 - OpenAI
  - Cliente de OpenAI
  - Procesador de mensajes
  - Sistema de logs

- **Día 8-9:** Testing y Refinamiento
  - Pruebas completas
  - Corrección de bugs
  - UX improvements

- **Día 10:** Deploy
  - Deploy en Vercel
  - Configuración final
  - Documentación

---

## Siguiente Paso Inmediato

**Comenzar con Fase 2: Conexión WhatsApp**

1. Instalar whatsapp-web.js (ya instalado ✅)
2. Crear `lib/whatsapp/client.ts`
3. Crear `app/api/whatsapp/connect/route.ts`
4. Probar generación de QR

¿Quieres que comience con la implementación de la Fase 2?
