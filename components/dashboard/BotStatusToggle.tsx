'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Play, Pause, AlertCircle } from 'lucide-react';

export function BotStatusToggle() {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/bot/pause');
      const result = await response.json();

      if (result.success) {
        setIsActive(result.data.is_active);
      } else {
        setError(result.error || 'Error al cargar estado');
      }
    } catch (err) {
      setError('Error al cargar estado del bot');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (newValue: boolean) => {
    setUpdating(true);
    setError(null);

    try {
      const response = await fetch('/api/bot/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newValue })
      });

      const result = await response.json();

      if (result.success) {
        setIsActive(newValue);
      } else {
        throw new Error(result.error || 'Error al actualizar estado');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isActive ? (
            <>
              <Play className="h-5 w-5 text-green-600" />
              Bot Activo
            </>
          ) : (
            <>
              <Pause className="h-5 w-5 text-orange-600" />
              Bot Pausado
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isActive
            ? 'El bot está procesando mensajes y enviando respuestas automáticas'
            : 'El bot está pausado y no responderá a los mensajes'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="bot-toggle" className="text-base">
              Estado del Bot
            </Label>
            <p className="text-sm text-muted-foreground">
              {isActive ? 'Pausar respuestas automáticas' : 'Reanudar respuestas automáticas'}
            </p>
          </div>
          <Switch
            id="bot-toggle"
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={updating}
          />
        </div>

        {updating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Actualizando estado...</span>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Tip: Puedes pausar el bot temporalmente si necesitas responder manualmente o
            si estás realizando cambios en la configuración.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
