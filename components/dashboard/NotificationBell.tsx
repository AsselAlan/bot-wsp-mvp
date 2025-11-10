'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface NotificationData {
  pendingOrders: number
  unansweredMessages: number
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationData>({
    pendingOrders: 0,
    unansweredMessages: 0,
  })

  const totalNotifications = notifications.pendingOrders + notifications.unansweredMessages

  useEffect(() => {
    fetchNotifications()

    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      // Obtener pedidos pendientes
      const ordersResponse = await fetch('/api/bot/orders?status=pending')
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const pendingOrders = ordersData.orders?.length || 0

        // Obtener mensajes sin responder
        const messagesResponse = await fetch('/api/bot/unanswered')
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          const unansweredMessages = messagesData.stats?.unreviewedCount || 0

          setNotifications({
            pendingOrders,
            unansweredMessages,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalNotifications > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalNotifications > 9 ? '9+' : totalNotifications}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {totalNotifications === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No tienes notificaciones pendientes
          </div>
        ) : (
          <>
            {notifications.pendingOrders > 0 && (
              <DropdownMenuItem asChild>
                <Link href="/dashboard/orders?status=pending" className="cursor-pointer">
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <span className="text-lg">📦</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {notifications.pendingOrders}{' '}
                        {notifications.pendingOrders === 1 ? 'pedido nuevo' : 'pedidos nuevos'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {notifications.pendingOrders === 1
                          ? 'Requiere tu atención'
                          : 'Requieren tu atención'}
                      </div>
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            )}

            {notifications.unansweredMessages > 0 && (
              <DropdownMenuItem asChild>
                <Link href="/dashboard/unanswered" className="cursor-pointer">
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                      <span className="text-lg">💬</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {notifications.unansweredMessages}{' '}
                        {notifications.unansweredMessages === 1
                          ? 'mensaje sin responder'
                          : 'mensajes sin responder'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Revisa y responde desde WhatsApp
                      </div>
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button onClick={fetchNotifications} className="w-full text-center text-sm">
                Actualizar notificaciones
              </button>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
