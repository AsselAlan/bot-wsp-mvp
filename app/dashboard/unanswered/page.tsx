'use client';

import { useEffect, useState } from 'react';
import { UnansweredMessagesList } from '@/components/unanswered/UnansweredMessagesList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Filter } from 'lucide-react';
import type { UnansweredMessage, UnansweredMessagesResponse } from '@/types';

export default function UnansweredMessagesPage() {
  const [data, setData] = useState<UnansweredMessagesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'true' | 'false'>('false'); // default: mostrar no revisados
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bot/unanswered?reviewed=${filter}`);
      if (!response.ok) {
        throw new Error('Error al obtener mensajes');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching unanswered messages:', err);
      setError('Error al cargar los mensajes sin responder');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const handleMarkReviewed = async (messageId: string) => {
    try {
      const response = await fetch('/api/bot/unanswered', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          action: 'review',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al marcar mensaje como revisado');
      }

      // Recargar mensajes
      await fetchMessages();
    } catch (err) {
      console.error('Error marking message as reviewed:', err);
      alert('Error al marcar el mensaje como revisado');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Mensajes Sin Responder</h1>
        <p className="text-gray-600">
          Revisa y gestiona los mensajes que el bot no pudo responder automáticamente
        </p>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Sin Responder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">
                {data.stats.percentageUnanswered.toFixed(1)}% del total de mensajes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                No Revisados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">{data.stats.unreviewedCount}</div>
                {data.stats.unreviewedCount > 0 && (
                  <Badge variant="destructive">Requiere atención</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Revisados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats.total - data.stats.unreviewedCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data.stats.total > 0
                  ? (
                      ((data.stats.total - data.stats.unreviewedCount) / data.stats.total) *
                      100
                    ).toFixed(1)
                  : 0}
                % completado
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtra los mensajes por estado</CardDescription>
            </div>
            <Button onClick={fetchMessages} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'false' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('false')}
            >
              <Filter className="w-4 h-4 mr-2" />
              No Revisados ({data?.stats.unreviewedCount || 0})
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              <Filter className="w-4 h-4 mr-2" />
              Todos ({data?.stats.total || 0})
            </Button>
            <Button
              variant={filter === 'true' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('true')}
            >
              <Filter className="w-4 h-4 mr-2" />
              Revisados ({data ? data.stats.total - data.stats.unreviewedCount : 0})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages List */}
      {!error && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {filter === 'false' && 'Mensajes No Revisados'}
            {filter === 'true' && 'Mensajes Revisados'}
            {filter === 'all' && 'Todos los Mensajes'}
          </h2>
          <UnansweredMessagesList
            messages={data?.messages || []}
            onMarkReviewed={handleMarkReviewed}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
