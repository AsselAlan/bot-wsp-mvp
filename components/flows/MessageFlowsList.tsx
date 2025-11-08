'use client';

import { useState } from 'react';
import { MessageFlow } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Power, PowerOff, Loader2 } from 'lucide-react';

interface MessageFlowsListProps {
  flows: MessageFlow[];
  onCreateNew: () => void;
  onEdit: (flow: MessageFlow) => void;
  onDelete: (flowId: string) => Promise<void>;
  onToggleActive: (flowId: string, isActive: boolean) => Promise<void>;
  isLoading?: boolean;
}

export default function MessageFlowsList({
  flows,
  onCreateNew,
  onEdit,
  onDelete,
  onToggleActive,
  isLoading = false,
}: MessageFlowsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleDelete = async (flowId: string, flowName: string) => {
    if (!confirm(`¿Estás seguro de eliminar el flujo "${flowName}"?`)) {
      return;
    }

    setDeletingId(flowId);
    try {
      await onDelete(flowId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (flowId: string, currentState: boolean) => {
    setTogglingId(flowId);
    try {
      await onToggleActive(flowId, !currentState);
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botón crear */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tus Flujos de Mensajes</h3>
          <p className="text-sm text-muted-foreground">
            {flows.length === 0
              ? 'No tienes flujos creados aún'
              : `${flows.length} flujo${flows.length !== 1 ? 's' : ''} configurado${flows.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCreateNew();
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Crear Nuevo Flujo
        </Button>
      </div>

      {/* Lista de flujos */}
      {flows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-blue-50 dark:bg-blue-950 p-4">
                <Plus className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">No hay flujos creados</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea tu primer flujo conversacional para automatizar interacciones
                </p>
                <Button onClick={onCreateNew} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Flujo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map((flow) => (
            <Card
              key={flow.id}
              className={`relative transition-all hover:shadow-md ${
                !flow.is_active ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{flow.icon}</div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{flow.name}</CardTitle>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {flow.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            Predeterminado
                          </Badge>
                        )}
                        <Badge
                          variant={flow.is_active ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {flow.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Descripción */}
                {flow.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {flow.description}
                  </p>
                )}

                {/* Información del flujo */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Pasos:</span>
                    <span className="font-medium">{flow.steps.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Activación:</span>
                    <span className="font-medium">
                      {flow.activation_type === 'keywords' ? 'Palabras clave' : 'IA'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Acción final:</span>
                    <span className="font-medium capitalize">
                      {flow.final_action.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Palabras clave */}
                {flow.activation_type === 'keywords' && flow.activation_keywords && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Palabras clave:</p>
                    <div className="flex flex-wrap gap-1">
                      {flow.activation_keywords.slice(0, 3).map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {flow.activation_keywords.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{flow.activation_keywords.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(flow);
                    }}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(flow.id, flow.is_active)}
                    disabled={togglingId === flow.id}
                    title={flow.is_active ? 'Desactivar' : 'Activar'}
                  >
                    {togglingId === flow.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : flow.is_active ? (
                      <PowerOff className="h-3 w-3" />
                    ) : (
                      <Power className="h-3 w-3" />
                    )}
                  </Button>

                  {!flow.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(flow.id, flow.name)}
                      disabled={deletingId === flow.id}
                      className="text-red-600 hover:text-red-700"
                      title="Eliminar"
                    >
                      {deletingId === flow.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
