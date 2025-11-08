'use client';

import { useState, useEffect } from 'react';
import { MessageFlow, FlowStep, FlowFinalAction } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Trash2, Play, AlertCircle, Sparkles, MessageSquare } from 'lucide-react';
import FlowStepCard from './FlowStepCard';

interface MessageFlowEditorProps {
  flow?: MessageFlow | null;
  onSave: (flow: Partial<MessageFlow>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}

export default function MessageFlowEditor({ flow, onSave, onDelete, onCancel }: MessageFlowEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('💬');
  const [activationType, setActivationType] = useState<'keywords' | 'ai'>('keywords');
  const [activationKeywords, setActivationKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [activationPrompt, setActivationPrompt] = useState('');
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [finalActionType, setFinalActionType] = useState<'create_order' | 'send_notification' | 'save_info' | 'webhook'>('save_info');
  const [finalActionConfig, setFinalActionConfig] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // Cargar datos del flujo si existe
  useEffect(() => {
    if (flow) {
      setName(flow.name);
      setDescription(flow.description || '');
      setIcon(flow.icon);
      setActivationType(flow.activation_type);
      setActivationKeywords(flow.activation_keywords || []);
      setActivationPrompt(flow.activation_prompt || '');
      setSteps(flow.steps);
      setFinalActionType(flow.final_action.type);
      setFinalActionConfig(flow.final_action.config);
    } else {
      // Inicializar con un paso vacío
      setSteps([createEmptyStep(1)]);
    }
  }, [flow]);

  const createEmptyStep = (order: number): FlowStep => ({
    order,
    context: '',
    expected_trigger: '',
    bot_response: '',
    validation_type: 'any',
  });

  const addStep = () => {
    const newStep = createEmptyStep(steps.length + 1);
    setSteps([...steps, newStep]);
  };

  const updateStep = (index: number, updatedStep: FlowStep) => {
    const newSteps = [...steps];
    newSteps[index] = updatedStep;
    setSteps(newSteps);
  };

  const deleteStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Reordenar
    newSteps.forEach((step, i) => {
      step.order = i + 1;
    });
    setSteps(newSteps);
  };

  const moveStep = (index: number, direction: 'left' | 'right') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSteps.length) return;

    // Intercambiar
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];

    // Reordenar
    newSteps.forEach((step, i) => {
      step.order = i + 1;
    });

    setSteps(newSteps);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !activationKeywords.includes(keywordInput.trim())) {
      setActivationKeywords([...activationKeywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setActivationKeywords(activationKeywords.filter(k => k !== keyword));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Por favor ingresa un nombre para el flujo');
      return;
    }

    if (steps.length === 0) {
      alert('El flujo debe tener al menos un paso');
      return;
    }

    // Validar que todos los pasos tengan contenido
    const invalidSteps = steps.filter(s => !s.context.trim() || !s.bot_response.trim());
    if (invalidSteps.length > 0) {
      alert('Todos los pasos deben tener contexto y respuesta del bot');
      return;
    }

    if (activationType === 'keywords' && activationKeywords.length === 0) {
      alert('Debes agregar al menos una palabra clave para activar el flujo');
      return;
    }

    if (activationType === 'ai' && !activationPrompt.trim()) {
      alert('Debes agregar un prompt de activación para la IA');
      return;
    }

    setSaving(true);

    try {
      const flowData: Partial<MessageFlow> = {
        name,
        description: description || null,
        icon,
        activation_type: activationType,
        activation_keywords: activationType === 'keywords' ? activationKeywords : null,
        activation_prompt: activationType === 'ai' ? activationPrompt : null,
        steps,
        final_action: {
          type: finalActionType,
          config: finalActionConfig,
        },
      };

      await onSave(flowData);
    } catch (error) {
      console.error('Error al guardar flujo:', error);
      alert('Error al guardar el flujo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Flujo</CardTitle>
          <CardDescription>Configura los datos básicos de tu flujo de mensajes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="flow-name">Nombre del Flujo</Label>
              <Input
                id="flow-name"
                placeholder="Ej: Tomar Pedido de Delivery"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flow-icon">Icono</Label>
              <Input
                id="flow-icon"
                placeholder="💬"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flow-description">Descripción (opcional)</Label>
            <Textarea
              id="flow-description"
              placeholder="Describe brevemente qué hace este flujo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuración de activación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-600" />
            Activación del Flujo
          </CardTitle>
          <CardDescription>Define cómo se detectará el inicio de este flujo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activation-type">Tipo de Activación</Label>
            <Select value={activationType} onValueChange={(v: 'keywords' | 'ai') => setActivationType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keywords">Palabras Clave (Rápido y económico)</SelectItem>
                <SelectItem value="ai">Inteligencia Artificial (Flexible, usa tokens)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activationType === 'keywords' && (
            <div className="space-y-2">
              <Label>Palabras Clave</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: pedido, comprar, quiero"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                />
                <Button type="button" onClick={addKeyword} variant="secondary">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {activationKeywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="gap-1">
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                El flujo se activará cuando el mensaje contenga alguna de estas palabras
              </p>
            </div>
          )}

          {activationType === 'ai' && (
            <div className="space-y-2">
              <Label htmlFor="activation-prompt">Prompt de Activación para IA</Label>
              <Textarea
                id="activation-prompt"
                placeholder="Ej: El usuario quiere realizar un pedido de comida..."
                value={activationPrompt}
                onChange={(e) => setActivationPrompt(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Describe la intención que debe detectar la IA para activar este flujo
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pasos del flujo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Pasos del Flujo
              </CardTitle>
              <CardDescription>Define la secuencia de mensajes del bot</CardDescription>
            </div>
            <Button onClick={addStep} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Paso
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay pasos configurados</p>
              <Button onClick={addStep} variant="outline" size="sm" className="mt-4">
                Agregar Primer Paso
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-min">
                {steps.map((step, index) => (
                  <FlowStepCard
                    key={step.order}
                    step={step}
                    stepNumber={index + 1}
                    totalSteps={steps.length}
                    onChange={(updatedStep) => updateStep(index, updatedStep)}
                    onDelete={() => deleteStep(index)}
                    onMoveLeft={index > 0 ? () => moveStep(index, 'left') : undefined}
                    onMoveRight={index < steps.length - 1 ? () => moveStep(index, 'right') : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acción final */}
      <Card>
        <CardHeader>
          <CardTitle>Acción al Completar el Flujo</CardTitle>
          <CardDescription>¿Qué debe hacer el sistema cuando el flujo termine?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="final-action">Tipo de Acción</Label>
            <Select
              value={finalActionType}
              onValueChange={(v: any) => setFinalActionType(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="create_order">Crear Pedido</SelectItem>
                <SelectItem value="send_notification">Enviar Notificación</SelectItem>
                <SelectItem value="save_info">Guardar Información del Cliente</SelectItem>
                <SelectItem value="webhook">Llamar Webhook Externo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configuración específica según el tipo */}
          {finalActionType === 'webhook' && (
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL del Webhook</Label>
              <Input
                id="webhook-url"
                placeholder="https://api.ejemplo.com/webhook"
                value={finalActionConfig.webhook_url || ''}
                onChange={(e) => setFinalActionConfig({ ...finalActionConfig, webhook_url: e.target.value })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-between items-center pt-4">
        <div>
          {flow && onDelete && (
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={saving}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Flujo
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>Guardando...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Flujo
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
