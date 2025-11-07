'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, AlertCircle, CheckCircle2, Bell } from 'lucide-react';
import { BotConfig, BusinessInfo } from '@/types';

export function BotConfigForm() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);

  // Form state
  const [mainContext, setMainContext] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-3.5-turbo');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [temperature, setTemperature] = useState([0.7]);
  const [notificationNumber, setNotificationNumber] = useState('');
  const [enableNotifications, setEnableNotifications] = useState(false);

  // Nuevos campos de configuración de prompt
  const [tone, setTone] = useState<'formal' | 'casual' | 'friendly'>('friendly');
  const [useEmojis, setUseEmojis] = useState<'never' | 'moderate' | 'frequent'>('moderate');
  const [strictMode, setStrictMode] = useState(true);
  const [responseLength, setResponseLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [customInstructions, setCustomInstructions] = useState('');

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
        setMainContext(config.main_context);
        setBusinessName(config.business_info.name || '');
        setBusinessHours(config.business_info.hours || '');
        setBusinessAddress(config.business_info.address || '');
        setBusinessPhone(config.business_info.phone || '');
        setOpenaiModel(config.openai_model);
        setOpenaiApiKey(config.openai_api_key || '');
        setTemperature([config.temperature]);
        setNotificationNumber(config.notification_number || '');
        setEnableNotifications(config.enable_unanswered_notifications || false);

        // Cargar nuevos campos de configuración de prompt
        setTone(config.tone || 'friendly');
        setUseEmojis(config.use_emojis || 'moderate');
        setStrictMode(config.strict_mode ?? true);
        setResponseLength(config.response_length || 'medium');
        setCustomInstructions(config.custom_instructions || '');
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
        main_context: mainContext,
        business_info: {
          name: businessName,
          hours: businessHours,
          address: businessAddress,
          phone: businessPhone
        },
        openai_model: openaiModel,
        openai_api_key: openaiApiKey || null,
        temperature: temperature[0],
        notification_number: notificationNumber || null,
        enable_unanswered_notifications: enableNotifications,
        tone: tone,
        use_emojis: useEmojis,
        strict_mode: strictMode,
        response_length: responseLength,
        custom_instructions: customInstructions
      };

      const response = await fetch('/api/bot/config', {
        method: hasConfig ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
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
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-900 dark:text-green-100">
            Configuración guardada exitosamente
          </p>
        </div>
      )}

      {/* Contexto Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Contexto Principal</CardTitle>
          <CardDescription>
            Define cómo debe comportarse tu bot. Este es el prompt base que se usará.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={mainContext}
            onChange={(e) => setMainContext(e.target.value)}
            placeholder="Ejemplo: Eres un asistente virtual de una pizzería. Debes ser amable y ayudar con pedidos..."
            rows={6}
            required
          />
        </CardContent>
      </Card>

      {/* Información del Negocio */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Negocio</CardTitle>
          <CardDescription>
            Datos que el bot usará para responder preguntas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessName">Nombre del Negocio</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Mi Negocio"
              />
            </div>
            <div>
              <Label htmlFor="businessPhone">Teléfono</Label>
              <Input
                id="businessPhone"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="businessHours">Horarios de Atención</Label>
            <Input
              id="businessHours"
              value={businessHours}
              onChange={(e) => setBusinessHours(e.target.value)}
              placeholder="Lunes a Viernes 9:00 - 18:00"
            />
          </div>
          <div>
            <Label htmlFor="businessAddress">Dirección</Label>
            <Input
              id="businessAddress"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              placeholder="Calle 123, Ciudad"
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuración OpenAI */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración OpenAI</CardTitle>
          <CardDescription>
            Ajustes del modelo de inteligencia artificial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="model">Modelo</Label>
            <Select value={openaiModel} onValueChange={setOpenaiModel}>
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Más rápido y económico)</SelectItem>
                <SelectItem value="gpt-4">GPT-4 (Más preciso)</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Equilibrado)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="apiKey">API Key de OpenAI (opcional)</Label>
            <Input
              id="apiKey"
              type="password"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Si no proporcionas una, se usará la API key del sistema
            </p>
          </div>

          <div>
            <Label>Temperatura (Creatividad): {temperature[0]}</Label>
            <Slider
              value={temperature}
              onValueChange={setTemperature}
              min={0}
              max={2}
              step={0.1}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              0 = Más preciso y consistente | 2 = Más creativo y variado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Comportamiento del Bot */}
      <Card>
        <CardHeader>
          <CardTitle>Comportamiento del Bot</CardTitle>
          <CardDescription>
            Personaliza cómo responde el bot a los mensajes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tone">Tono de las Respuestas</Label>
            <Select value={tone} onValueChange={(value: any) => setTone(value)}>
              <SelectTrigger id="tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal - Profesional y técnico</SelectItem>
                <SelectItem value="casual">Casual - Relajado y coloquial</SelectItem>
                <SelectItem value="friendly">Amigable - Cálido pero profesional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="useEmojis">Uso de Emojis</Label>
            <Select value={useEmojis} onValueChange={(value: any) => setUseEmojis(value)}>
              <SelectTrigger id="useEmojis">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Nunca - Sin emojis</SelectItem>
                <SelectItem value="moderate">Moderado - 1-2 emojis por mensaje</SelectItem>
                <SelectItem value="frequent">Frecuente - Varios emojis expresivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="responseLength">Longitud de Respuestas</Label>
            <Select value={responseLength} onValueChange={(value: any) => setResponseLength(value)}>
              <SelectTrigger id="responseLength">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Corta - 1-2 oraciones</SelectItem>
                <SelectItem value="medium">Media - 2-4 oraciones</SelectItem>
                <SelectItem value="long">Larga - Respuestas detalladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label htmlFor="strictMode">Modo Estricto</Label>
              <p className="text-xs text-muted-foreground">
                El bot NO inventará información que no esté en el contexto
              </p>
            </div>
            <Switch
              id="strictMode"
              checked={strictMode}
              onCheckedChange={setStrictMode}
            />
          </div>

          <div>
            <Label htmlFor="customInstructions">Instrucciones Personalizadas (Opcional)</Label>
            <Textarea
              id="customInstructions"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Agrega instrucciones adicionales específicas para tu bot..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ejemplo: &quot;Siempre menciona que tenemos envío gratis en pedidos mayores a $50&quot;
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones de Mensajes Sin Responder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones de Mensajes Sin Responder
          </CardTitle>
          <CardDescription>
            Recibe alertas por WhatsApp cuando el bot no pueda responder un mensaje
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enableNotifications">Activar Notificaciones</Label>
              <p className="text-xs text-muted-foreground">
                Enviar alertas cuando hay mensajes sin responder
              </p>
            </div>
            <Switch
              id="enableNotifications"
              checked={enableNotifications}
              onCheckedChange={setEnableNotifications}
            />
          </div>

          {enableNotifications && (
            <div>
              <Label htmlFor="notificationNumber">Número para Notificaciones</Label>
              <Input
                id="notificationNumber"
                value={notificationNumber}
                onChange={(e) => setNotificationNumber(e.target.value)}
                placeholder="+5491112345678"
                type="tel"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formato: Código de país + número (ej: +5491112345678 para Argentina)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={saving}>
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
    </form>
  );
}
