'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, AlertCircle, CheckCircle2, Bell, Key } from 'lucide-react';
import { BotConfig } from '@/types';

export function BotConfigForm() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);

  // Form state (solo campos editables)
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [notificationNumber, setNotificationNumber] = useState('');
  const [enableNotifications, setEnableNotifications] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bot/config');
      const result = await response.json();

      if (result.success && result.data) {
        const config: BotConfig = result.data;
        setHasConfig(true);
        setOpenaiApiKey(config.openai_api_key || '');
        setCustomInstructions(config.custom_instructions || '');
        setNotificationNumber(config.notification_number || '');
        setEnableNotifications(config.enable_unanswered_notifications || false);
      }
    } catch (err) {
      setError('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const configData = {
        openai_api_key: openaiApiKey,
        custom_instructions: customInstructions,
        notification_number: notificationNumber,
        enable_unanswered_notifications: enableNotifications,
      };

      const method = hasConfig ? 'PUT' : 'POST';
      const response = await fetch('/api/bot/config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al guardar configuración');
      }

      setSuccess(true);
      setHasConfig(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success message */}
      {success && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <p className="text-sm text-green-900 dark:text-green-100 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Configuración guardada exitosamente
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <p className="text-sm text-red-900 dark:text-red-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            💡 <strong>Nota:</strong> La configuración principal del bot se genera automáticamente desde la plantilla seleccionada en <strong>Flujos de Trabajo</strong>. Aquí solo puedes configurar aspectos técnicos opcionales.
          </p>
        </CardContent>
      </Card>

      {/* API Key Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            OpenAI API Key
          </CardTitle>
          <CardDescription>
            Clave de API de OpenAI (opcional si ya configuraste una variable de entorno)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-api-key">API Key</Label>
            <Input
              id="openai-api-key"
              type="password"
              placeholder="sk-..."
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Si no proporcionas una API Key aquí, el sistema usará la configurada en variables de entorno
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Custom Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones Personalizadas (Opcional)</CardTitle>
          <CardDescription>
            Instrucciones adicionales específicas para tu bot que se agregarán al contexto generado automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ejemplo: Siempre mencionar la promoción 2x1 los martes&#10;Ejemplo: Priorizar atención a clientes VIP"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Estas instrucciones se agregarán al contexto generado desde tu plantilla de negocio
          </p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Recibe alertas cuando el bot no pueda responder un mensaje
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activar notificaciones</Label>
              <p className="text-sm text-muted-foreground">
                Recibir alertas de mensajes sin responder
              </p>
            </div>
            <Switch
              checked={enableNotifications}
              onCheckedChange={setEnableNotifications}
            />
          </div>

          {enableNotifications && (
            <div className="space-y-2">
              <Label htmlFor="notification-number">Número de WhatsApp para notificaciones</Label>
              <Input
                id="notification-number"
                type="text"
                placeholder="+54 9 11 1234-5678"
                value={notificationNumber}
                onChange={(e) => setNotificationNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Formato: +[código país] [código área] [número]
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
