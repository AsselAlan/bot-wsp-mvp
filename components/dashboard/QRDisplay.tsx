'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2, CheckCircle2, QrCode } from 'lucide-react';

interface QRDisplayProps {
  onConnected?: () => void;
}

export function QRDisplay({ onConnected }: QRDisplayProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Polling para verificar el estado y obtener QR
  useEffect(() => {
    if (loading && !connected) {
      const interval = setInterval(async () => {
        try {
          // Verificar estado
          const statusRes = await fetch('/api/whatsapp/status');
          const statusData = await statusRes.json();

          if (statusData.connected) {
            setConnected(true);
            setLoading(false);
            setQrCode(null);
            if (onConnected) {
              onConnected();
            }
            return;
          }

          // Obtener QR si no está conectado
          const qrRes = await fetch('/api/whatsapp/qr');
          const qrData = await qrRes.json();

          if (qrData.qrCode) {
            setQrCode(qrData.qrCode);
          }
        } catch (err) {
          console.error('Error en polling:', err);
        }
      }, 2000); // Polling cada 2 segundos

      return () => clearInterval(interval);
    }
  }, [loading, connected, onConnected]);

  const handleGenerateQR = async () => {
    setLoading(true);
    setError(null);
    setQrCode(null);
    setConnected(false);

    try {
      // Iniciar conexión (esto desconectará automáticamente cualquier cliente existente)
      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST'
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al iniciar conexión');
      }

      // El polling se encargará de obtener el QR
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  };

  if (connected) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200 dark:border-green-800">
        <CheckCircle2 className="h-24 w-24 text-green-600 dark:text-green-400 mb-4" />
        <p className="text-lg font-semibold text-green-900 dark:text-green-100">
          ¡WhatsApp Conectado!
        </p>
        <p className="text-sm text-green-700 dark:text-green-300 mt-2">
          Tu bot está listo para recibir mensajes
        </p>
      </div>
    );
  }

  if (loading && qrCode) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center p-6 bg-white dark:bg-gray-900 rounded-lg border-2">
          <Image
            src={qrCode}
            alt="QR Code de WhatsApp"
            width={300}
            height={300}
            className="rounded"
          />
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Esperando escaneo del código QR...
        </div>
      </div>
    );
  }

  if (loading && !qrCode) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-muted/50 rounded-lg border-2 border-dashed">
        <Loader2 className="h-16 w-16 text-muted-foreground animate-spin mb-4" />
        <p className="text-muted-foreground">Generando código QR...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center p-12 bg-muted/50 rounded-lg border-2 border-dashed">
        <QrCode className="h-24 w-24 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">
          Haz clic en el botón para generar el código QR
        </p>
        <button
          onClick={handleGenerateQR}
          disabled={loading}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Generar Código QR
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-900 dark:text-red-100">
            Error: {error}
          </p>
        </div>
      )}
    </div>
  );
}
