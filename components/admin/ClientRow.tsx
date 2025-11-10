'use client'

import { ClientData } from '@/types/roles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Settings, Eye, Wifi, WifiOff, Package } from 'lucide-react'
import Link from 'next/link'
import { useAdmin } from '@/contexts/AdminContext'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface ClientRowProps {
  client: ClientData
}

export function ClientRow({ client }: ClientRowProps) {
  const { setSelectedClient } = useAdmin()

  const handleConfigureClick = () => {
    setSelectedClient(client)
  }

  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="py-3 px-4">
        <div>
          <div className="font-medium">{client.business_name || 'Sin nombre'}</div>
          <div className="text-sm text-muted-foreground">{client.email}</div>
        </div>
      </td>

      <td className="py-3 px-4">
        {client.template_name ? (
          <Badge variant="outline">{client.template_name}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">Sin plantilla</span>
        )}
      </td>

      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {client.whatsapp_connected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium text-green-600">Conectado</div>
                <div className="text-xs text-muted-foreground">{client.phone_number}</div>
              </div>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-muted-foreground">Sin conectar</span>
            </>
          )}
        </div>
      </td>

      <td className="py-3 px-4">
        <div className="flex flex-col gap-1">
          <div className="text-sm">
            <span className="text-muted-foreground">Mensajes hoy:</span>{' '}
            <span className="font-medium">{client.total_messages_today || 0}</span>
          </div>
          {client.pending_orders !== undefined && client.pending_orders > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Pedidos:</span>{' '}
              <Badge variant="default" className="ml-1">
                {client.pending_orders}
              </Badge>
            </div>
          )}
          {client.unanswered_messages !== undefined && client.unanswered_messages > 0 && (
            <div className="text-sm">
              <span className="text-muted-foreground">Sin responder:</span>{' '}
              <Badge variant="destructive" className="ml-1">
                {client.unanswered_messages}
              </Badge>
            </div>
          )}
        </div>
      </td>

      <td className="py-3 px-4 text-sm text-muted-foreground">
        {client.last_connected
          ? formatDistanceToNow(new Date(client.last_connected), {
              addSuffix: true,
              locale: es,
            })
          : 'Nunca'}
      </td>

      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/config" onClick={handleConfigureClick}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Configurar
            </Button>
          </Link>

          {client.pending_orders !== undefined && client.pending_orders > 0 && (
            <Link href="/dashboard/orders" onClick={handleConfigureClick}>
              <Button variant="default" size="sm">
                <Package className="h-4 w-4 mr-1" />
                Ver Pedidos
              </Button>
            </Link>
          )}

          <Link href="/dashboard" onClick={handleConfigureClick}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </td>
    </tr>
  )
}
