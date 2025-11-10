'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  LayoutDashboard,
  Wifi,
  Settings,
  LogOut,
  AlertCircle,
  Workflow,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { NotificationBell } from '@/components/dashboard/NotificationBell'
import { AdminProvider } from '@/contexts/AdminContext'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [supportsOrders, setSupportsOrders] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'client' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Get user role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      setUserRole(userData?.role || 'client')

      // Get bot config with template (only for clients, or when admin selects a client)
      const { data: botConfig } = await supabase
        .from('bot_configs')
        .select('selected_template_id')
        .eq('user_id', user.id)
        .single()

      if (botConfig?.selected_template_id) {
        // Get template info
        const { data: template } = await supabase
          .from('business_templates')
          .select('supports_orders')
          .eq('id', botConfig.selected_template_id)
          .single()

        setSupportsOrders(template?.supports_orders || false)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  const isAdmin = userRole === 'admin'

  return (
    <AdminProvider>
      <div className="min-h-screen bg-background">
        {/* Top Header */}
        <header className="border-b">
          <div className="flex h-16 items-center px-4 md:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <MessageSquare className="h-6 w-6" />
              <span className="hidden sm:inline-block">WhatsApp Bot</span>
            </Link>

            {/* Admin Badge */}
            {isAdmin && (
              <Badge variant="default" className="ml-3">
                ADMIN
              </Badge>
            )}

            <div className="ml-auto flex items-center gap-4">
              {/* Notification Bell - Solo para clientes */}
              {!isAdmin && <NotificationBell />}

              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden md:flex w-64 flex-col gap-2 border-r bg-muted/40 p-4">
            <nav className="space-y-1">
              {/* VISTA ADMIN */}
              {isAdmin ? (
                <>
                  {/* Gestión de Clientes */}
                  <Link href="/dashboard/clients">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Users className="h-4 w-4" />
                      Mis Clientes
                    </Button>
                  </Link>

                  <Link href="/dashboard">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>

                  <Separator className="my-2" />

                  {/* Configuración */}
                  <Link href="/dashboard/config">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Settings className="h-4 w-4" />
                      Configuración
                    </Button>
                  </Link>

                  <Link href="/dashboard/workflows">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Workflow className="h-4 w-4" />
                      Flujos de Trabajo
                    </Button>
                  </Link>

                  <Separator className="my-2" />

                  {/* Sección condicional: Pedidos */}
                  {supportsOrders && (
                    <Link href="/dashboard/orders">
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Pedidos
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                /* VISTA CLIENTE */
                <>
                  {/* Enlaces principales para clientes */}
                  <Link href="/dashboard/orders">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Pedidos
                    </Button>
                  </Link>

                  <Link href="/dashboard/connection">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Wifi className="h-4 w-4" />
                      Conexión WhatsApp
                    </Button>
                  </Link>

                  <Link href="/dashboard/unanswered">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Mensajes Sin Responder
                    </Button>
                  </Link>
                </>
              )}
            </nav>

            {/* Info Card - Solo para clientes */}
            {!isAdmin && (
              <div className="mt-auto p-4 border rounded-lg bg-background">
                <div className="text-sm font-medium mb-2">Ayuda</div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    ¿Necesitas cambios en la configuración?
                  </div>
                  <div className="mt-2 text-primary font-medium">
                    Contacta a soporte
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </AdminProvider>
  )
}
