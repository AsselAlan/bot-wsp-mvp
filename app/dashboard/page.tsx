'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BotStatusToggle } from '@/components/dashboard/BotStatusToggle'
import { MetricsCards } from '@/components/dashboard/MetricsCards'
import { Button } from '@/components/ui/button'
import { Users, Settings, Wifi, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAdmin } from '@/contexts/AdminContext'
import { ClientStats } from '@/types/roles'
import Link from 'next/link'

export default function DashboardPage() {
  const { isAdminView } = useAdmin()
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState<ClientStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserRole()
    if (isAdminView) {
      loadAdminStats()
    }
  }, [isAdminView])

  const checkUserRole = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

        setIsAdmin(userData?.role === 'admin')
      }
    } catch (error) {
      console.error('Error checking role:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/clients?stats=true')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading admin stats:', error)
    }
  }

  if (loading) {
    return <div className="p-8">Cargando...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin
            ? 'Panel de administración - Vista general de todos los clientes'
            : 'Bienvenido a tu panel de control de WhatsApp Bot'}
        </p>
      </div>

      {/* Vista ADMIN */}
      {isAdmin ? (
        <>
          {/* Estadísticas Globales */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_clients}</div>
                  <p className="text-xs text-muted-foreground">Cuentas activas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conectados Hoy</CardTitle>
                  <Wifi className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.connected_today}</div>
                  <p className="text-xs text-muted-foreground">WhatsApp activos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pedidos del Día</CardTitle>
                  <Package className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_orders_today}</div>
                  <p className="text-xs text-muted-foreground">Todos los clientes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sin Responder</CardTitle>
                  <Settings className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_unanswered}</div>
                  <p className="text-xs text-muted-foreground">Mensajes pendientes</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Acciones Rápidas Admin */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Gestiona tus clientes y sus configuraciones</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Link href="/dashboard/clients">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Ver Todos los Clientes
                </Button>
              </Link>
              <Link href="/dashboard/clients">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Crear Nuevo Cliente
                </Button>
              </Link>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Vista CLIENTE */
        <>
          {/* Metrics Grid */}
          <MetricsCards />

          {/* Bot Status Toggle */}
          <BotStatusToggle />

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>Gestiona tu bot de WhatsApp</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="/dashboard/connection"
                  className="block p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="font-medium">Conectar WhatsApp</div>
                  <div className="text-sm text-muted-foreground">
                    Escanea el código QR para vincular tu cuenta
                  </div>
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="block p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="font-medium">Ver Pedidos</div>
                  <div className="text-sm text-muted-foreground">
                    Gestiona los pedidos recibidos por WhatsApp
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Primeros Pasos</CardTitle>
                <CardDescription>Guía rápida para comenzar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    1
                  </div>
                  <div>
                    <div className="font-medium">Conecta WhatsApp</div>
                    <div className="text-sm text-muted-foreground">
                      Vincula tu cuenta escaneando el QR
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    2
                  </div>
                  <div>
                    <div className="font-medium">Espera Configuración</div>
                    <div className="text-sm text-muted-foreground">
                      El administrador configurará tu bot
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-between rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    3
                  </div>
                  <div>
                    <div className="font-medium">Recibe Pedidos</div>
                    <div className="text-sm text-muted-foreground">
                      Gestiona los pedidos desde el panel
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
