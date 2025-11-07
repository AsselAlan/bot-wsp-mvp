import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BotStatusToggle } from "@/components/dashboard/BotStatusToggle";
import { MetricsCards } from "@/components/dashboard/MetricsCards";

export default function DashboardPage() {

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido a tu panel de control de WhatsApp Bot
        </p>
      </div>

      {/* Metrics Grid */}
      <MetricsCards />

      {/* Bot Status Toggle */}
      <BotStatusToggle />

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Configura y administra tu bot de WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/dashboard/connection"
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="font-medium">Conectar WhatsApp</div>
              <div className="text-sm text-muted-foreground">
                Escanea el código QR para vincular tu cuenta
              </div>
            </a>
            <a
              href="/dashboard/config"
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="font-medium">Configurar Bot</div>
              <div className="text-sm text-muted-foreground">
                Personaliza el contexto y las respuestas del bot
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Primeros Pasos</CardTitle>
            <CardDescription>
              Guía rápida para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div>
                <div className="font-medium">Conecta WhatsApp</div>
                <div className="text-sm text-muted-foreground">
                  Vincula tu cuenta escaneando el QR
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              <div>
                <div className="font-medium">Configura el Contexto</div>
                <div className="text-sm text-muted-foreground">
                  Define cómo debe comportarse tu bot
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>
              <div>
                <div className="font-medium">Crea Mini Tareas</div>
                <div className="text-sm text-muted-foreground">
                  Respuestas automáticas para preguntas frecuentes
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
