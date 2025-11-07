'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  onDisconnect?: () => void;
}

export function ConnectionStatus({ onDisconnect }: ConnectionStatusProps) {
  const [connected, setConnected] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status');
      const data = await response.json();

      setConnected(data.connected || false);
      setPhoneNumber(data.phoneNumber || null);
    } catch (error) {
      console.error('Error verificando estado:', error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();

    // Polling cada 5 segundos
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de que deseas desconectar WhatsApp?')) {
      return;
    }

    setDisconnecting(true);

    try {
      const response = await fetch('/api/whatsapp/status', {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setConnected(false);
        setPhoneNumber(null);
        if (onDisconnect) {
          onDisconnect();
        }
      } else {
        alert('Error al desconectar: ' + data.message);
      }
    } catch (error) {
      console.error('Error desconectando:', error);
      alert('Error al desconectar WhatsApp');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Verificando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Badge
        variant={connected ? "default" : "secondary"}
        className="h-8 px-3"
      >
        {connected ? (
          <>
            <Wifi className="h-4 w-4 mr-1" />
            Conectado
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 mr-1" />
            Desconectado
          </>
        )}
      </Badge>

      {connected && phoneNumber && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Número: <span className="font-medium text-foreground">{phoneNumber}</span>
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Desconectando...
              </>
            ) : (
              'Desconectar'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
