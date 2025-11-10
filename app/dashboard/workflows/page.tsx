'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Workflow, FileText, MessageSquare, Loader2 } from 'lucide-react'
import BusinessOptionsForm from '@/components/templates/BusinessOptionsForm'
import MessageFlowsList from '@/components/flows/MessageFlowsList'
import MessageFlowEditor from '@/components/flows/MessageFlowEditor'
import { MessageFlow } from '@/types'
import { useAdmin } from '@/contexts/AdminContext'

export default function WorkflowsPage() {
  const { isAdminView, selectedClient } = useAdmin()
  const [flows, setFlows] = useState<MessageFlow[]>([])
  const [flowsLoading, setFlowsLoading] = useState(false)
  const [editingFlow, setEditingFlow] = useState<MessageFlow | null>(null)
  const [isCreatingFlow, setIsCreatingFlow] = useState(false)

  useEffect(() => {
    loadFlows()
  }, [selectedClient])

  // Cargar flujos de mensajes
  const loadFlows = async () => {
    try {
      setFlowsLoading(true)
      const response = await fetch('/api/bot/message-flows')
      const result = await response.json()

      if (result.success) {
        setFlows(result.flows || [])
      }
    } catch (err) {
      console.error('Error loading flows:', err)
    } finally {
      setFlowsLoading(false)
    }
  }

  // Crear nuevo flujo
  const handleCreateFlow = async (flowData: Partial<MessageFlow>) => {
    try {
      const response = await fetch('/api/bot/message-flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error al crear flujo')
      }

      setIsCreatingFlow(false)
      await loadFlows()
    } catch (err) {
      console.error('Error creating flow:', err)
      alert(err instanceof Error ? err.message : 'Error al crear flujo')
      throw err
    }
  }

  // Actualizar flujo existente
  const handleUpdateFlow = async (flowData: Partial<MessageFlow>) => {
    if (!editingFlow) return

    try {
      const response = await fetch(`/api/bot/message-flows/${editingFlow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar flujo')
      }

      setEditingFlow(null)
      await loadFlows()
    } catch (err) {
      console.error('Error updating flow:', err)
      alert(err instanceof Error ? err.message : 'Error al actualizar flujo')
      throw err
    }
  }

  // Eliminar flujo
  const handleDeleteFlow = async (flowId: string) => {
    try {
      const response = await fetch(`/api/bot/message-flows/${flowId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar flujo')
      }

      await loadFlows()
    } catch (err) {
      console.error('Error deleting flow:', err)
      alert(err instanceof Error ? err.message : 'Error al eliminar flujo')
    }
  }

  // Activar/desactivar flujo
  const handleToggleFlowActive = async (flowId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/bot/message-flows/${flowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error al cambiar estado')
      }

      await loadFlows()
    } catch (err) {
      console.error('Error toggling flow:', err)
      alert(err instanceof Error ? err.message : 'Error al cambiar estado')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración Avanzada</h1>
        <p className="text-muted-foreground mt-1">
          {isAdminView && selectedClient
            ? `Configurando opciones avanzadas para: ${selectedClient.business_name || selectedClient.email}`
            : 'Opciones específicas de tu plantilla, menú y flujos de mensajes'}
        </p>
      </div>

      {/* Tabs de Configuración Avanzada */}
      <Tabs defaultValue="options" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="options" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            <span className="hidden sm:inline">Opciones</span>
          </TabsTrigger>
          <TabsTrigger value="menu" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Menú</span>
          </TabsTrigger>
          <TabsTrigger value="flows" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Flujos de Mensajes</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Opciones de Plantilla */}
        <TabsContent value="options" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Opciones de Plantilla</CardTitle>
              <CardDescription>
                Configuraciones específicas según el tipo de negocio que seleccionaste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessOptionsForm />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Gestión de Menú */}
        <TabsContent value="menu" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Menú / Catálogo de Productos</CardTitle>
              <CardDescription>
                Configura tu menú, productos o servicios (próximamente)
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Gestión de menú en desarrollo</p>
              <p className="text-sm mt-2">Por ahora, configura tus productos en las opciones de plantilla</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Flujos de Mensajes */}
        <TabsContent value="flows" className="mt-6">
          {isCreatingFlow || editingFlow ? (
            <MessageFlowEditor
              flow={editingFlow || undefined}
              onSave={editingFlow ? handleUpdateFlow : handleCreateFlow}
              onCancel={() => {
                setIsCreatingFlow(false)
                setEditingFlow(null)
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Flujos de Mensajes Conversacionales</CardTitle>
                    <CardDescription>
                      Crea procesos automáticos paso a paso para gestionar pedidos, reservas, consultas, etc.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {flowsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <MessageFlowsList
                    flows={flows}
                    onEdit={setEditingFlow}
                    onDelete={handleDeleteFlow}
                    onToggleActive={handleToggleFlowActive}
                    onCreateNew={() => setIsCreatingFlow(true)}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
