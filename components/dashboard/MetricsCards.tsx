'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Bot, TrendingUp, AlertCircle } from "lucide-react";
import { Loader2 } from "lucide-react";

interface Metrics {
  totalChats: number;
  dailyChats: number;
  botResponses: number;
  unansweredCount: number;
}

export function MetricsCards() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/bot/metrics');
      const result = await response.json();

      if (result.success) {
        setMetrics(result.data);
      } else {
        setError('Error al cargar métricas');
      }
    } catch (err) {
      setError('Error al cargar métricas');
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="bg-muted">
        <CardContent className="flex items-center gap-2 py-4">
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {error || 'No se pudieron cargar las métricas'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Unanswered Messages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Sin Responder
          </CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.unansweredCount}</div>
          <p className="text-xs text-muted-foreground">
            Mensajes pendientes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
