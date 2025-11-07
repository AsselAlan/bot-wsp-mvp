'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { QRDisplay } from "@/components/dashboard/QRDisplay";
import { ConnectionStatus } from "@/components/dashboard/ConnectionStatus";

export default function ConnectionPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleConnected = () => {
    // Forzar re-render para actualizar el estado
    setRefreshKey(prev => prev + 1);
  };

  const handleDisconnected = () => {
    // Forzar re-render para actualizar el estado
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conexión WhatsApp</h1>
          <p className="text-muted-foreground mt-1">
            Conecta tu cuenta de WhatsApp para comenzar a usar el bot
          </p>
        </div>
        <ConnectionStatus key={refreshKey} onDisconnect={handleDisconnected} />
      </div>

      {/* QR Code Section */}
      <Card>
        <CardHeader>
          <CardTitle>Conectar WhatsApp</CardTitle>
          <CardDescription>
            Escanea el código QR con tu teléfono para vincular tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QR Display Component */}
          <QRDisplay onConnected={handleConnected} />

          {/* Instructions */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Cómo conectar WhatsApp:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Haz clic en "Generar Código QR"</li>
                <li>Abre WhatsApp en tu teléfono</li>
                <li>Ve a Configuración → Dispositivos vinculados</li>
                <li>Toca "Vincular dispositivo"</li>
                <li>Escanea el código QR que aparece arriba</li>
              </ol>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            El código QR expira después de 60 segundos. Si expira, genera uno nuevo.
          </p>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-base">Información Importante</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            ✅ La conexión de WhatsApp está completamente funcional
          </p>
          <p>
            • La sesión se mantiene activa incluso si cierras el navegador
          </p>
          <p>
            • Puedes desconectar en cualquier momento usando el botón "Desconectar"
          </p>
          <p>
            • Solo puedes tener un dispositivo vinculado a la vez por usuario
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
