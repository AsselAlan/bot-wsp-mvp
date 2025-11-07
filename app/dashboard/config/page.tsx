'use client';

import { BotConfigForm } from "@/components/config/BotConfigForm";
import { Settings } from "lucide-react";

export default function ConfigPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuraciones Técnicas</h1>
        <p className="text-muted-foreground mt-1">
          Configura los aspectos técnicos del bot: modelo de IA, temperatura, notificaciones, etc.
        </p>
      </div>

      <BotConfigForm />
    </div>
  );
}
