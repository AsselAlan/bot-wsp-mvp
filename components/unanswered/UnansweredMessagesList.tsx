'use client';

import { useState } from 'react';
import { UnansweredMessage } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface UnansweredMessagesListProps {
  messages: UnansweredMessage[];
  onMarkReviewed: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const reasonLabels: Record<UnansweredMessage['reason'], { label: string; color: string; icon: any }> = {
  out_of_context: {
    label: 'Fuera de contexto',
    color: 'bg-orange-100 text-orange-800',
    icon: AlertCircle,
  },
  no_match: {
    label: 'Sin coincidencia',
    color: 'bg-blue-100 text-blue-800',
    icon: XCircle,
  },
  api_error: {
    label: 'Error de API',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
  paused: {
    label: 'Bot pausado',
    color: 'bg-gray-100 text-gray-800',
    icon: Clock,
  },
};

export function UnansweredMessagesList({
  messages,
  onMarkReviewed,
  isLoading = false,
}: UnansweredMessagesListProps) {
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const handleMarkReviewed = async (id: string) => {
    setReviewingId(id);
    try {
      await onMarkReviewed(id);
    } catch (error) {
      console.error('Error marking as reviewed:', error);
    } finally {
      setReviewingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Cargando mensajes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <CheckCircle2 className="mx-auto h-12 w-12 mb-2 text-green-500" />
            <p className="text-lg font-medium">¡Todo al día!</p>
            <p className="text-sm">No hay mensajes sin responder</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const reasonInfo = reasonLabels[message.reason];
        const Icon = reasonInfo.icon;
        const createdDate = new Date(message.created_at);
        const formattedDate = createdDate.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const formattedTime = createdDate.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <Card key={message.id} className={message.is_reviewed ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium">
                    {message.sender_number}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span>
                      {formattedDate} - {formattedTime}
                    </span>
                    <Badge variant="outline" className={reasonInfo.color}>
                      <Icon className="w-3 h-3 mr-1" />
                      {reasonInfo.label}
                    </Badge>
                    {message.is_reviewed && (
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Revisado
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Mensaje:</p>
                <p className="text-sm bg-gray-50 p-3 rounded-md border border-gray-200">
                  {message.message_text}
                </p>
              </div>

              {message.attempted_response && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Respuesta intentada:
                  </p>
                  <p className="text-sm bg-orange-50 p-3 rounded-md border border-orange-200 text-orange-900">
                    {message.attempted_response}
                  </p>
                </div>
              )}

              {!message.is_reviewed && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleMarkReviewed(message.id)}
                    disabled={reviewingId === message.id}
                    className="w-full sm:w-auto"
                  >
                    {reviewingId === message.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Marcando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Marcar como revisado
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
