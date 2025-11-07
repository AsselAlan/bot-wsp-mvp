'use client';

import { BotConfigForm } from "@/components/config/BotConfigForm";
import { Settings } from "lucide-react";

export default function ConfigPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración del Bot</h1>
        <p className="text-muted-foreground mt-1">
          Configura aspectos técnicos opcionales: API Key de OpenAI, instrucciones personalizadas y notificaciones.
        </p>
      </div>

      <BotConfigForm />
    </div>
  );
}
