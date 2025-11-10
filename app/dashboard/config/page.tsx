'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { TemplateSelector } from '@/components/templates/TemplateSelector'
import { BusinessOptionsForm } from '@/components/templates/BusinessOptionsForm'
import { BotConfigForm } from '@/components/config/BotConfigForm'
import { OrderConfigForm } from '@/components/orders/OrderConfigForm'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Settings, Store, ShoppingCart, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAdmin } from '@/contexts/AdminContext'

export default function ConfigPage() {
  const { selectedClient, isAdminView } = useAdmin()
  const [supportsOrders, setSupportsOrders] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('template')

  useEffect(() => {
    checkTemplateSupportsOrders()
  }, [selectedClient])

  const checkTemplateSupportsOrders = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Obtener el user_id correcto (admin o cliente)
      let userId = selectedClient?.id

      if (!userId) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        userId = user?.id
      }

      if (!userId) return

      // Obtener configuración del bot
      const { data: botConfig } = await supabase
        .from('bot_configs')
        .select('selected_template_id')
        .eq('user_id', userId)
        .single()

      if (botConfig?.selected_template_id) {
        // Obtener info del template
        const { data: template } = await supabase
          .from('business_templates')
          .select('supports_orders')
          .eq('id', botConfig.selected_template_id)
          .single()

        setSupportsOrders(template?.supports_orders || false)
      }
    } catch (error) {
      console.error('Error checking template:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          {isAdminView && selectedClient
            ? `Configurando bot para: ${selectedClient.business_name || selectedClient.email}`
            : 'Configura tu bot de WhatsApp'}
        </p>
      </div>

      {/* Alerta para clientes */}
      {!isAdminView && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Nota:</strong> La configuración de tu bot es gestionada por el administrador.
            Si necesitas cambios, contacta a soporte.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs de Configuración */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="template" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Plantilla</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Negocio</span>
          </TabsTrigger>
          {supportsOrders && (
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="technical" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Técnico</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Selección de Plantilla */}
        <TabsContent value="template" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Plantilla de Negocio</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Selecciona el tipo de negocio para configurar automáticamente tu bot
                </p>
              </div>
              <TemplateSelector onTemplateChange={checkTemplateSupportsOrders} />
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Información del Negocio */}
        <TabsContent value="business" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Información del Negocio</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configura los datos específicos de tu negocio
                </p>
              </div>
              <BusinessOptionsForm />
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Configuración de Pedidos (condicional) */}
        {supportsOrders && (
          <TabsContent value="orders" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">Configuración de Pedidos</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Define cómo se gestionarán los pedidos por WhatsApp
                </p>
              </div>
              <OrderConfigForm />
            </div>
          </TabsContent>
        )}

        {/* Tab 4: Configuración Técnica */}
        <TabsContent value="technical" className="space-y-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Configuración Técnica</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Opciones avanzadas: API Keys, notificaciones y ajustes del modelo
              </p>
            </div>
            <BotConfigForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
