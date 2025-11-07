# Troubleshooting - Solución de Problemas

## Problema Resuelto: Error de Compilación con whatsapp-web.js

### Error Original
```
Module not found: Can't resolve 'WAWebPollsVotesSchema'
```

### Causa
Next.js 16 usa **Turbopack** por defecto, y `whatsapp-web.js` requiere ejecutarse en el runtime completo de Node.js, no puede ser bundled por el compilador de Next.js.

### Solución Implementada

#### 1. Configuración de Next.js (`next.config.ts`)
```typescript
const nextConfig: NextConfig = {
  // Configuración para Turbopack (Next.js 16+)
  turbopack: {},

  // Excluir paquetes del bundling del servidor
  serverExternalPackages: ['whatsapp-web.js', 'puppeteer', 'qrcode-terminal'],
};
```

#### 2. Runtime de API Routes
Todos los endpoints de WhatsApp necesitan:
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

Archivos modificados:
- `app/api/whatsapp/connect/route.ts`
- `app/api/whatsapp/qr/route.ts`
- `app/api/whatsapp/status/route.ts`

### Por Qué Funciona

1. **`turbopack: {}`** - Le indica a Next.js que estamos usando Turbopack
2. **`serverExternalPackages`** - Excluye estos paquetes del proceso de optimización
3. **`runtime: 'nodejs'`** - Fuerza el uso del runtime completo de Node.js
4. **`dynamic: 'force-dynamic'`** - Previene el cacheo estático

---

## Otros Problemas Comunes

### El código QR no aparece

**Causa:** El cliente de WhatsApp está tardando en inicializarse.

**Solución:**
- Espera 10-20 segundos después de hacer clic en "Generar Código QR"
- La primera vez puede tardar más porque Puppeteer descarga Chromium
- Revisa los logs del servidor para ver el progreso

### "Cliente no encontrado"

**Causa:** El cliente no se inicializó correctamente.

**Solución:**
1. Verifica que el servidor esté corriendo
2. Haz clic en "Generar Código QR" nuevamente
3. Revisa los logs del servidor para errores

### El bot no mantiene la conexión después de reiniciar

**Causa:** La carpeta `.wwebjs_auth` se eliminó.

**Solución:**
- No elimines la carpeta `.wwebjs_auth/`
- Esta carpeta contiene las sesiones guardadas
- Agrégala al `.gitignore` pero no la borres

### Error: "Puppeteer not found"

**Causa:** Puppeteer no está instalado correctamente.

**Solución:**
```bash
npm install puppeteer --force
```

### El servidor se queda "colgado" al generar QR

**Causa:** Puppeteer está descargando Chromium por primera vez.

**Solución:**
- Es normal en la primera ejecución
- Espera 1-2 minutos
- Verás logs indicando el progreso de la descarga

---

## Logs Útiles

### Conexión Exitosa
```
QR Code generado para usuario demo-user-1
Cliente autenticado para usuario demo-user-1
Cliente WhatsApp listo para usuario demo-user-1
```

### Error de Conexión
```
Error al conectar WhatsApp: [mensaje de error]
Fallo de autenticación para usuario demo-user-1
```

---

## Comandos Útiles

### Limpiar y Reinstalar
```bash
rm -rf node_modules package-lock.json
npm install
```

### Limpiar Sesiones de WhatsApp
```bash
rm -rf .wwebjs_auth
```
⚠️ Esto desconectará todos los clientes

### Verificar Tipos
```bash
npm run type-check
```

### Build de Producción
```bash
npm run build
```

---

## Configuración del Entorno

### Variables de Entorno Necesarias
```env
# Supabase (opcional para Fase 2)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI (opcional para Fase 2)
OPENAI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Requisitos del Sistema
- Node.js 18+
- 2GB RAM mínimo (para Puppeteer)
- Espacio en disco: ~500MB (para Chromium)

---

## FAQ

### ¿Puedo usar WhatsApp Web en otro dispositivo al mismo tiempo?
No, WhatsApp solo permite un dispositivo vinculado a la vez por sesión.

### ¿Se pierden los mensajes mientras el servidor está apagado?
No, los mensajes se envían a tu teléfono normalmente. El bot simplemente no responderá hasta que el servidor esté corriendo nuevamente.

### ¿Puedo tener múltiples usuarios conectados?
Sí, el sistema está preparado para múltiples usuarios. Cada uno tendrá su propio cliente y sesión.

### ¿Es seguro conectar mi WhatsApp personal?
Para desarrollo/pruebas, considera usar un número secundario. Para producción, implementa autenticación y seguridad apropiadas.

---

## Recursos Adicionales

- [whatsapp-web.js Documentación](https://wwebjs.dev/)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Puppeteer Troubleshooting](https://pptr.dev/troubleshooting)

---

## Estado Actual del Proyecto

✅ **Fase 1:** Setup Base - Completada
✅ **Fase 2:** Conexión WhatsApp - Completada y Funcionando
🚧 **Fase 3:** Dashboard con Datos Reales - Pendiente
⏳ **Fase 4:** Configuración del Bot - Pendiente
⏳ **Fase 5:** Integración OpenAI - Pendiente
⏳ **Fase 6:** Testing y Deploy - Pendiente
