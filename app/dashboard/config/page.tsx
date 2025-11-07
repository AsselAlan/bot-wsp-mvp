'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BotConfigForm } from "@/components/config/BotConfigForm";
import { MiniTasksList } from "@/components/config/MiniTasksList";
import { Settings, Zap } from "lucide-react";

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

      {/* Tabs */}
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <Zap className="h-4 w-4 mr-2" />
            Mini Tareas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="mt-6">
          <BotConfigForm />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <MiniTasksList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
