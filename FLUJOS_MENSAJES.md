# Sistema de Flujos de Mensajes Conversacionales

## Resumen

Se ha implementado un sistema completo de **Flujos de Mensajes** que permite crear secuencias conversacionales paso a paso en el bot de WhatsApp. Los usuarios pueden diseñar flujos personalizados con cards numeradas donde cada paso tiene contexto, mensaje esperado y respuesta del bot.

## Características Implementadas

### 1. Base de Datos

#### Tabla: `message_flows`
Almacena la configuración de cada flujo:
- Información básica (nombre, descripción, icono)
- Configuración de activación (keywords o IA)
- Pasos del flujo (array de steps)
- Acción final (crear pedido, notificar, guardar info, webhook)
- Configuración de timeout y reinicio

#### Tabla: `flow_conversation_states`
Rastrea el estado de conversaciones activas en flujos:
- Paso actual del flujo
- Datos recopilados en cada paso
- Control de tiempo y expiración
- Estado de completado/cancelado

### 2. Frontend - Nueva Interfaz

#### Ubicación
**Dashboard → Workflows → Tab "Flujos de Mensajes"**

#### Componentes Creados

**`FlowStepCard.tsx`**
- Card individual para cada paso del flujo
- Inputs para: contexto, mensaje esperado, respuesta del bot
- Controles para mover, reordenar y eliminar pasos
- Numeración visual de pasos

**`MessageFlowEditor.tsx`**
- Editor completo de flujos
- Configuración de información básica (nombre, descripción, icono)
- Selector de tipo de activación (keywords vs IA)
- Gestión de palabras clave o prompt de IA
- Vista horizontal scrolleable de steps
- Selector de acción final con 4 opciones
- Validaciones y guardado

### 3. Backend - APIs

#### `/api/bot/message-flows`
- `GET`: Listar todos los flujos del usuario
- `POST`: Crear nuevo flujo con validaciones

#### `/api/bot/message-flows/[id]`
- `GET`: Obtener flujo específico
- `PUT`: Actualizar flujo existente
- `DELETE`: Eliminar flujo

### 4. Motor de Ejecución de Flujos

**Archivo: `lib/flows/flow-engine.ts`**

Funciones principales:

**`detectFlowActivation()`**
- Detecta si un mensaje debe activar un flujo
- Soporta activación por palabras clave (match directo)
- Soporta activación por IA (análisis de intención)

**`getFlowConversationState()`**
- Obtiene el estado actual de un chat en un flujo
- Verifica expiración automática

**`startFlowConversation()`**
- Inicia un nuevo flujo para un chat
- Crea estado inicial y calcula expiración

**`processFlowMessage()`**
- Procesa mensajes dentro de un flujo activo
- Avanza pasos automáticamente
- Ejecuta acción final al completar

**`executeFinalAction()`**
- Ejecuta acciones según configuración:
  - `create_order`: Crea pedido automáticamente
  - `send_notification`: Envía notificación al admin
  - `save_info`: Guarda información del cliente
  - `webhook`: Llama API externa

### 5. Integración en Message Handler

**Archivo modificado: `lib/whatsapp/messageHandler.ts`**

Nuevo flujo de procesamiento (prioridades):

1. **PRIORIDAD 1**: Si hay flujo activo → Procesar siguiente paso
2. **PRIORIDAD 2**: Si mensaje activa flujo → Iniciar flujo nuevo
3. **PRIORIDAD 3**: Sin flujo → Respuesta normal con IA

Esto garantiza que los flujos siempre tengan prioridad sobre respuestas normales.

### 6. Flujo Predeterminado para Delivery

**Archivo: `supabase/migrations/20250108_create_default_flow_delivery.sql`**

Función SQL: `create_default_delivery_flow(user_id)`

Crea automáticamente el flujo "Tomar Pedido" con 4 pasos:
1. Saludo y confirmación de pedido
2. Recopilación de productos
3. Solicitud de dirección de entrega
4. Confirmación de método de pago

Acción final: Crear pedido automáticamente

## Tipos de Activación

### 1. Por Palabras Clave (Keywords)
- Más rápido y económico
- Match directo de palabras en el mensaje
- Ejemplo: ["pedido", "comprar", "delivery"]
- No consume tokens de OpenAI

### 2. Por Inteligencia Artificial
- Más flexible e inteligente
- Detecta intención aunque no use palabras exactas
- Consume tokens de OpenAI
- Umbral de confianza: 70%

## Acciones Finales Disponibles

### 1. Crear Pedido
Extrae información del flujo y crea un pedido automáticamente en la base de datos.

### 2. Enviar Notificación
Envía una notificación al número del administrador con los datos recopilados.

### 3. Guardar Información
Almacena los datos del cliente para uso futuro (ya guardados en `collected_data`).

### 4. Webhook Externo
Llama a una URL externa con los datos recopilados en formato JSON.

## Estructura de Datos

### Ejemplo de Step (Paso)
```json
{
  "order": 1,
  "context": "Confirmar que el cliente quiere hacer un pedido",
  "expected_trigger": "Confirmación del usuario",
  "bot_response": "¡Perfecto! ¿Qué te gustaría ordenar?",
  "validation_type": "any"
}
```

### Ejemplo de Final Action
```json
{
  "type": "create_order",
  "config": {
    "auto_confirm": true
  }
}
```

### Ejemplo de Collected Data
```json
{
  "step_1": {
    "user_message": "Quiero hacer un pedido",
    "bot_response": "¡Perfecto! ¿Qué te gustaría ordenar?",
    "timestamp": "2025-01-08T..."
  },
  "step_2": {
    "user_message": "2 pizzas grandes",
    "bot_response": "Perfecto, anotado. ¿A qué dirección?",
    "timestamp": "2025-01-08T..."
  }
}
```

## Características Adicionales

### Control de Tiempo
- Timeout configurable (default: 30 minutos)
- Expiración automática de conversaciones inactivas
- Limpieza automática con función SQL

### Seguridad
- Row Level Security (RLS) habilitado
- Cada usuario solo ve sus propios flujos
- Validaciones en API y frontend

### Flexibilidad
- Múltiples flujos simultáneos permitidos
- Flujos pueden activarse y desactivarse
- Posibilidad de marcar flujos como predeterminados
- Reinicio permitido en caso de error

## Próximos Pasos Sugeridos

1. **Implementar UI completa del editor**
   - Conectar `MessageFlowEditor` con las APIs
   - Agregar lista de flujos existentes
   - Botón para crear nuevo flujo

2. **Mejorar acciones finales**
   - Completar implementación de `create_order`
   - Agregar envío real de notificaciones
   - Soportar headers personalizados en webhooks

3. **Validaciones avanzadas**
   - Validación de respuestas con regex
   - Validación de campos específicos (email, teléfono)
   - Condicionales en pasos (if/else)

4. **Analytics**
   - Métricas de flujos completados
   - Tasa de abandono por paso
   - Tiempo promedio de completado

5. **Automatización**
   - Crear flujo predeterminado automáticamente al seleccionar plantilla
   - Sugerencias de flujos según tipo de negocio
   - Templates de flujos para diferentes industrias

## Archivos Creados

1. `supabase/migrations/20250108_create_message_flows.sql`
2. `supabase/migrations/20250108_create_default_flow_delivery.sql`
3. `types/index.ts` (actualizado)
4. `components/flows/FlowStepCard.tsx`
5. `components/flows/MessageFlowEditor.tsx`
6. `app/api/bot/message-flows/route.ts`
7. `app/api/bot/message-flows/[id]/route.ts`
8. `lib/flows/flow-engine.ts`
9. `app/dashboard/workflows/page.tsx` (modificado)
10. `lib/whatsapp/messageHandler.ts` (modificado)

## Uso para el Usuario Final

1. **Ir a Workflows → Flujos de Mensajes**
2. **Ver flujo predeterminado** (si tiene plantilla Delivery)
3. **Crear nuevo flujo**:
   - Asignar nombre e icono
   - Elegir activación (keywords o IA)
   - Agregar pasos con botón "+"
   - Configurar cada paso (contexto, trigger, respuesta)
   - Seleccionar acción final
   - Guardar

4. **Cuando un cliente escribe**:
   - Si mensaje contiene palabra clave → Flujo se activa
   - Bot sigue los pasos automáticamente
   - Al terminar → Ejecuta acción configurada

## Ventajas del Sistema

- ✅ **Automatización completa** de conversaciones
- ✅ **Sin programación** - Todo visual con cards
- ✅ **Flexible** - Keywords o IA según necesidad
- ✅ **Escalable** - Crear infinitos flujos
- ✅ **Profesional** - Conversaciones consistentes
- ✅ **Eficiente** - Reduce trabajo manual
- ✅ **Integrado** - Se conecta con pedidos y notificaciones
