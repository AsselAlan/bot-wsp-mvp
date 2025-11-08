'use client';

import { FlowStep } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X, GripVertical } from 'lucide-react';

interface FlowStepCardProps {
  step: FlowStep;
  stepNumber: number;
  totalSteps: number;
  onChange: (updatedStep: FlowStep) => void;
  onDelete: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
}

export default function FlowStepCard({
  step,
  stepNumber,
  totalSteps,
  onChange,
  onDelete,
  onMoveLeft,
  onMoveRight,
}: FlowStepCardProps) {
  const handleFieldChange = (field: keyof FlowStep, value: any) => {
    onChange({
      ...step,
      [field]: value,
    });
  };

  return (
    <Card className="relative min-w-[350px] max-w-[350px] flex-shrink-0">
      {/* Header con número y controles */}
      <CardHeader className="pb-3 pt-4 px-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">
              {stepNumber}
            </div>
            <span className="font-semibold text-sm">Paso {stepNumber}</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Botón mover izquierda */}
            {stepNumber > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveLeft}
                className="h-7 w-7 p-0"
                title="Mover a la izquierda"
              >
                ←
              </Button>
            )}

            {/* Botón mover derecha */}
            {stepNumber < totalSteps && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveRight}
                className="h-7 w-7 p-0"
                title="Mover a la derecha"
              >
                →
              </Button>
            )}

            {/* Botón eliminar */}
            {totalSteps > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Eliminar paso"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Campo: Contexto Principal */}
        <div className="space-y-2">
          <Label htmlFor={`context-${step.order}`} className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Contexto Principal
          </Label>
          <Textarea
            id={`context-${step.order}`}
            placeholder="Describe el objetivo de este paso..."
            value={step.context}
            onChange={(e) => handleFieldChange('context', e.target.value)}
            className="min-h-[80px] text-sm resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Explica qué información se debe obtener en este paso
          </p>
        </div>

        {/* Campo: Mensaje Esperado de Activación */}
        <div className="space-y-2">
          <Label htmlFor={`trigger-${step.order}`} className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Mensaje Esperado (Usuario)
          </Label>
          <Input
            id={`trigger-${step.order}`}
            placeholder="Ej: Respuesta del cliente..."
            value={step.expected_trigger}
            onChange={(e) => handleFieldChange('expected_trigger', e.target.value)}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Qué tipo de respuesta esperas del usuario
          </p>
        </div>

        {/* Campo: Respuesta del Bot */}
        <div className="space-y-2">
          <Label htmlFor={`response-${step.order}`} className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Respuesta del Bot
          </Label>
          <Textarea
            id={`response-${step.order}`}
            placeholder="¿Cuál es tu dirección de entrega?"
            value={step.bot_response}
            onChange={(e) => handleFieldChange('bot_response', e.target.value)}
            className="min-h-[80px] text-sm resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Lo que el bot responderá en este paso
          </p>
        </div>

        {/* Indicador de paso */}
        <div className="pt-2 border-t">
          <p className="text-xs text-center text-muted-foreground">
            Paso {stepNumber} de {totalSteps}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
