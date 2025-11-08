# Changelog - Sistema de Flujos de Mensajes

## [2025-01-08] - Sistema Completo de Flujos de Mensajes Conversacionales

### ✨ Nuevas Funcionalidades

#### 🔄 Sistema de Flujos de Mensajes
- **Interfaz visual completa** para crear y gestionar flujos conversacionales
- **Editor de pasos horizontales** con cards numeradas (1º, 2º, 3º, etc.)
- **Dos tipos de activación**:
  - Por palabras clave (rápido, sin costo de tokens)
  - Por IA (inteligente, detección de intención)
- **4 tipos de acciones finales**:
  - Crear pedido automáticamente
  - Enviar notificación al administrador
  - Guardar información del cliente
  - Llamar webhook externo

#### 📋 Componentes Creados
- `MessageFlowsList.tsx`: Lista visual de flujos con cards
- `MessageFlowEditor.tsx`: Editor completo con configuración
- `FlowStepCard.tsx`: Cards individuales para cada paso del flujo

#### 🗄️ Base de Datos
- Tabla `message_flows`: Almacena configuración de flujos
- Tabla `flow_conversation_states`: Rastrea conversaciones activas
- Función SQL `create_default_delivery_flow()`: Crea flujo predeterminado

#### 🎯 Flujo Predeterminado "Tomar Pedido"
- **Automático** para plantilla "Servicio de Delivery de Comida"
- **4 pasos predefinidos**:
  1. Confirmación de pedido
  2. Productos deseados
  3. Dirección de entrega
  4. Método de pago
- **Palabras clave**: pedido, pedir, quiero, comprar, ordenar, delivery

#### 🔌 APIs Creadas
- `GET /api/bot/message-flows` - Listar flujos
- `POST /api/bot/message-flows` - Crear flujo
- `GET /api/bot/message-flows/[id]` - Obtener flujo
- `PUT /api/bot/message-flows/[id]` - Actualizar flujo
- `DELETE /api/bot/message-flows/[id]` - Eliminar flujo
- `POST /api/bot/message-flows/create-default` - Crear flujo predeterminado

#### ⚙️ Motor de Ejecución
- **Detección automática** de activación de flujos
- **Gestión de estados** por conversación
- **Prioridades**: Flujo activo → Nuevo flujo → Respuesta IA normal
- **Timeout configurable** (default: 30 minutos)
- **Expiración automática** de conversaciones inactivas

### 🛠️ Mejoras Técnicas
- Integración completa en `messageHandler.ts`
- Soporte para Next.js 15+ (params async)
- TypeScript types actualizados
- Row Level Security (RLS) en tablas
- Validaciones completas en frontend y backend

### 📁 Archivos Nuevos
- `supabase/migrations/20250108_create_message_flows.sql`
- `supabase/migrations/20250108_create_default_flow_delivery.sql`
- `components/flows/MessageFlowsList.tsx`
- `components/flows/MessageFlowEditor.tsx`
- `components/flows/FlowStepCard.tsx`
- `app/api/bot/message-flows/route.ts`
- `app/api/bot/message-flows/[id]/route.ts`
- `app/api/bot/message-flows/create-default/route.ts`
- `lib/flows/flow-engine.ts`
- `FLUJOS_MENSAJES.md`
- `CREAR_FLUJO_RAPIDO.sql`

### 📝 Archivos Modificados
- `types/index.ts` - Agregados tipos de flujos
- `app/dashboard/workflows/page.tsx` - Tab "Flujos de Mensajes"
- `lib/whatsapp/messageHandler.ts` - Integración motor de flujos
- `app/api/bot/message-flows/[id]/route.ts` - Fix params async

### 🎨 Experiencia de Usuario
- Vista de lista con cards visuales de flujos
- Botones: Editar, Activar/Desactivar, Eliminar
- Badges: "Predeterminado", "Activo/Inactivo"
- Editor visual con pasos horizontales scrolleables
- Agregar/eliminar/reordenar pasos fácilmente
- Configuración de activación visual
- Selector de acción final

### 🔐 Seguridad
- RLS habilitado en todas las tablas
- Validaciones en API routes
- Solo propietarios pueden ver/editar sus flujos
- Flujos predeterminados no eliminables

### 📊 Características del Sistema
- ✅ Múltiples flujos por usuario
- ✅ Flujos activos/inactivos
- ✅ Recopilación de datos por paso
- ✅ Ejecución de acciones al finalizar
- ✅ Control de tiempo y expiración
- ✅ Reinicio de flujos permitido
- ✅ Manejo de errores personalizado

### 🚀 Próximos Pasos Sugeridos
- [ ] Crear plantillas adicionales de negocios
- [ ] Agregar validaciones avanzadas de pasos
- [ ] Implementar condicionales (if/else) en flujos
- [ ] Analytics de flujos (completados, abandonados)
- [ ] Templates de flujos predefinidos
- [ ] Exportar/importar flujos

### 📌 Notas Importantes
- El sistema de Flujos de Mensajes funciona para **TODAS las plantillas**
- Flujo predeterminado solo se crea para plantilla de Delivery
- Los usuarios pueden crear flujos personalizados sin límite
- Cada flujo puede tener activación y acciones diferentes

---

## Versión
**v1.2.0** - Sistema de Flujos de Mensajes Conversacionales Completo
