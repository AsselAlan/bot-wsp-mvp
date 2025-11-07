import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Bot, TrendingUp, Wifi } from "lucide-react";
import { BotStatusToggle } from "@/components/dashboard/BotStatusToggle";

export default function DashboardPage() {
  // TODO: Estos datos vendrán de Supabase
  const metrics = {
    totalChats: 0,
    dailyChats: 0,
    botResponses: 0,
    isConnected: false,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenido a tu panel de control de WhatsApp Bot
          </p>
        </div>
        <Badge variant={metrics.isConnected ? "default" : "secondary"} className="h-8">
          <Wifi className="h-4 w-4 mr-1" />
          {metrics.isConnected ? "Conectado" : "Desconectado"}
        </Badge>
      </div>

      {/* Alert Banner */}
      {!metrics.isConnected && (
        <Card className="bg-muted">
          <CardHeader>
            <CardTitle>Conecta tu WhatsApp</CardTitle>
            <CardDescription>
              Para comenzar a usar el bot, primero debes conectar tu cuenta de WhatsApp.
              Ve a la sección de{" "}
              <a href="/dashboard/connection" className="text-primary underline">
                Conexión
              </a>
              {" "}para escanear el código QR.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Chats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Chats
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalChats}</div>
            <p className="text-xs text-muted-foreground">
              Conversaciones totales
            </p>
          </CardContent>
        </Card>

        {/* Daily Chats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chats de Hoy
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dailyChats}</div>
            <p className="text-xs text-muted-foreground">
              Conversaciones hoy
            </p>
          </CardContent>
        </Card>

        {/* Bot Responses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Respuestas del Bot
            </CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.botResponses}</div>
            <p className="text-xs text-muted-foreground">
              Respuestas automáticas hoy
            </p>
          </CardContent>
        </Card>
      </div>

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
