'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workflow, FileText, ShoppingCart, Info, Loader2, Sparkles, MessageSquare } from "lucide-react";
import TemplateSelector from '@/components/templates/TemplateSelector';
import BusinessOptionsForm from '@/components/templates/BusinessOptionsForm';
import MessageFlowsList from '@/components/flows/MessageFlowsList';
import MessageFlowEditor from '@/components/flows/MessageFlowEditor';
import { TemplateWithOptions, MessageFlow } from '@/types';
import { applyTemplateToConfig } from '@/lib/templates/template-builder';

export default function WorkflowsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithOptions | null>(null);
  const [templateOptions, setTemplateOptions] = useState<Record<string, any>>({});
  const [currentConfig, setCurrentConfig] = useState<any>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para flujos de mensajes
  const [flows, setFlows] = useState<MessageFlow[]>([]);
  const [flowsLoading, setFlowsLoading] = useState(false);
  const [editingFlow, setEditingFlow] = useState<MessageFlow | null>(null);
  const [isCreatingFlow, setIsCreatingFlow] = useState(false);

  useEffect(() => {
    loadCurrentConfig();
    loadFlows();
  }, []);

  const loadCurrentConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bot/config');
      const result = await response.json();

      if (result.success && result.data) {
        setCurrentConfig(result.data);
        setTemplateOptions(result.data.template_options || {});

        // Si tiene template seleccionada, cargarla
        if (result.data.selected_template_id) {
          const templatesResponse = await fetch('/api/bot/templates');
          const templatesData = await templatesResponse.json();
          const template = templatesData.templates?.find((t: any) => t.id === result.data.selected_template_id);
          if (template) {
            setSelectedTemplate(template);
          }
        }
      }
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar flujos de mensajes
  const loadFlows = async () => {
    try {
      setFlowsLoading(true);
      const response = await fetch('/api/bot/message-flows');
      const result = await response.json();

      if (result.success) {
        setFlows(result.flows || []);
      }
    } catch (err) {
      console.error('Error loading flows:', err);
    } finally {
      setFlowsLoading(false);
    }
  };

  // Crear nuevo flujo
  const handleCreateFlow = async (flowData: Partial<MessageFlow>) => {
    try {
      const response = await fetch('/api/bot/message-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al crear flujo');
      }

      setIsCreatingFlow(false);
      await loadFlows();
    } catch (err) {
      console.error('Error creating flow:', err);
      alert(err instanceof Error ? err.message : 'Error al crear flujo');
      throw err;
    }
  };

  // Actualizar flujo existente
  const handleUpdateFlow = async (flowData: Partial<MessageFlow>) => {
    if (!editingFlow) return;

    try {
      const response = await fetch(`/api/bot/message-flows/${editingFlow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar flujo');
      }

      setEditingFlow(null);
      await loadFlows();
    } catch (err) {
      console.error('Error updating flow:', err);
      alert(err instanceof Error ? err.message : 'Error al actualizar flujo');
      throw err;
    }
  };

  // Eliminar flujo
  const handleDeleteFlow = async (flowId: string) => {
    try {
      const response = await fetch(`/api/bot/message-flows/${flowId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar flujo');
      }

      await loadFlows();
    } catch (err) {
      console.error('Error deleting flow:', err);
      alert(err instanceof Error ? err.message : 'Error al eliminar flujo');
    }
  };

  // Activar/desactivar flujo
  const handleToggleFlowActive = async (flowId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/bot/message-flows/${flowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al cambiar estado');
      }

      await loadFlows();
    } catch (err) {
      console.error('Error toggling flow:', err);
      alert(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  const handleSaveWorkflow = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/bot/config', {
        method: currentConfig ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_template_id: selectedTemplate?.id || null,
          template_options: templateOptions,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al guardar');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadCurrentConfig();

      // Si es plantilla de Delivery, crear flujo predeterminado si no existe
      if (selectedTemplate?.slug === 'servicio-delivery-comida') {
        try {
          await fetch('/api/bot/message-flows/create-default', {
            method: 'POST',
          });
          // Recargar flujos para mostrar el nuevo
          await loadFlows();
        } catch (err) {
          console.error('Error creando flujo predeterminado:', err);
          // No mostrar error al usuario, es opcional
        }
      }

    } catch (err) {
      console.error('Error saving workflow:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Flujos de Trabajo</h1>
        <p className="text-muted-foreground mt-1">
          Configura cómo tu bot maneja diferentes procesos de negocio: pedidos, menús, delivery, etc.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <p className="text-sm text-green-900 dark:text-green-100 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-white">✓</span>
              Flujo de trabajo guardado exitosamente
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Template Selection Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Plantilla de Negocio
              </CardTitle>
              <CardDescription>
                Selecciona el tipo de negocio para cargar configuraciones predefinidas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedTemplate ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-4xl">{selectedTemplate.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">{selectedTemplate.name}</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{selectedTemplate.description}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setTemplateOptions({});
                  }}
                >
                  Cambiar Plantilla
                </Button>
              </div>
            </div>
          ) : (
            <TemplateSelector
              onSelect={(template) => {
                setSelectedTemplate(template);
                setSuccess(false);
              }}
              selectedTemplateId={selectedTemplate?.id}
            />
          )}
        </CardContent>
      </Card>

      {/* Workflow Configuration Tabs */}
      {selectedTemplate && (
        <Tabs defaultValue="options" className="w-full">
          <TabsList className={`grid w-full max-w-2xl ${selectedTemplate.supports_orders ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="options">
              <Workflow className="h-4 w-4 mr-2" />
              Opciones
            </TabsTrigger>
            <TabsTrigger value="menu">
              <FileText className="h-4 w-4 mr-2" />
              Menú
            </TabsTrigger>
            {selectedTemplate.supports_orders && (
              <TabsTrigger value="orders">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Pedidos
              </TabsTrigger>
            )}
            <TabsTrigger value="flows">
              <MessageSquare className="h-4 w-4 mr-2" />
              Flujos de Mensajes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="options" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Opciones</CardTitle>
                <CardDescription>
                  Activa y configura las opciones específicas de tu negocio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BusinessOptionsForm
                  templateId={selectedTemplate.id}
                  initialValues={templateOptions}
                  onChange={(values) => {
                    setTemplateOptions(values);
                    setSuccess(false);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Menú</CardTitle>
                <CardDescription>
                  Configura cómo compartir tu menú con los clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Aquí se pueden agregar componentes específicos para gestión de menú */}
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-4">Opciones de menú configuradas en la sección de Opciones:</p>
                    <ul className="list-disc list-inside space-y-2">
                      {templateOptions.enable_menu_link && (
                        <li>✓ Menú por link: {templateOptions.menu_link_url || 'No configurado'}</li>
                      )}
                      {templateOptions.enable_menu_image && (
                        <li>✓ Menú por imagen: {templateOptions.menu_image_url || 'No configurado'}</li>
                      )}
                      {templateOptions.enable_menu_document && (
                        <li>✓ Menú en documento: Configurado</li>
                      )}
                      {!templateOptions.enable_menu_link && !templateOptions.enable_menu_image && !templateOptions.enable_menu_document && (
                        <li className="text-muted-foreground">No hay opciones de menú activadas</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {selectedTemplate.supports_orders && (
            <TabsContent value="orders" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gestión de Pedidos</CardTitle>
                  <CardDescription>
                    Configura cómo manejar los pedidos de tus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-4">Opciones de pedidos configuradas:</p>
                      <ul className="list-disc list-inside space-y-2">
                        {templateOptions.enable_order_whatsapp && (
                          <li>✓ Tomar pedidos por WhatsApp</li>
                        )}
                        {templateOptions.enable_order_redirect && (
                          <li>✓ Redirigir a plataforma: {templateOptions.order_platform_url || 'No configurado'}</li>
                        )}
                        {templateOptions.minimum_order && (
                          <li>✓ Monto mínimo: {templateOptions.minimum_order}</li>
                        )}
                        {!templateOptions.enable_order_whatsapp && !templateOptions.enable_order_redirect && (
                          <li className="text-muted-foreground">No hay opciones de pedidos activadas</li>
                        )}
                      </ul>
                      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                          💡 Configuración Avanzada
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Para configurar zonas de delivery, métodos de pago y mensajes personalizados, ve a la página de <strong>Pedidos</strong> en el menú lateral.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="flows" className="mt-6">
            {isCreatingFlow || editingFlow ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingFlow ? `Editando: ${editingFlow.name}` : 'Crear Nuevo Flujo'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MessageFlowEditor
                    flow={editingFlow}
                    onSave={editingFlow ? handleUpdateFlow : handleCreateFlow}
                    onDelete={editingFlow ? async () => {
                      await handleDeleteFlow(editingFlow.id);
                      setEditingFlow(null);
                    } : undefined}
                    onCancel={() => {
                      setIsCreatingFlow(false);
                      setEditingFlow(null);
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <MessageFlowsList
                flows={flows}
                onCreateNew={() => {
                  console.log('Creando nuevo flujo...');
                  setIsCreatingFlow(true);
                }}
                onEdit={(flow) => {
                  console.log('Editando flujo:', flow);
                  setEditingFlow(flow);
                }}
                onDelete={handleDeleteFlow}
                onToggleActive={handleToggleFlowActive}
                isLoading={flowsLoading}
              />
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Save Button */}
      {selectedTemplate && (
        <div className="flex justify-end">
          <Button
            type="button"
            size="lg"
            onClick={handleSaveWorkflow}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Workflow className="mr-2 h-4 w-4" />
                Guardar Flujo de Trabajo
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
