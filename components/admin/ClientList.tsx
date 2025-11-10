'use client'

import { useState } from 'react'
import { ClientData } from '@/types/roles'
import { ClientRow } from './ClientRow'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

interface ClientListProps {
  clients: ClientData[]
}

export function ClientList({ clients }: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'connected' | 'disconnected' | 'with_orders'>('all')

  // Filtrar clientes según búsqueda y filtro
  const filteredClients = clients.filter((client) => {
    // Filtro de búsqueda
    const matchesSearch =
      client.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone_number?.includes(searchTerm)

    if (!matchesSearch) return false

    // Filtro por estado
    if (filter === 'connected' && !client.whatsapp_connected) return false
    if (filter === 'disconnected' && client.whatsapp_connected) return false
    if (filter === 'with_orders' && (!client.pending_orders || client.pending_orders === 0))
      return false

    return true
  })

  return (
    <div className="space-y-4">
      {/* Búsqueda y Filtros */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({clients.length})</SelectItem>
            <SelectItem value="connected">
              Conectados ({clients.filter((c) => c.whatsapp_connected).length})
            </SelectItem>
            <SelectItem value="disconnected">
              Sin conectar ({clients.filter((c) => !c.whatsapp_connected).length})
            </SelectItem>
            <SelectItem value="with_orders">
              Con pedidos (
              {clients.filter((c) => c.pending_orders && c.pending_orders > 0).length})
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de Clientes */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-medium">Cliente</th>
              <th className="py-3 px-4 text-left text-sm font-medium">Plantilla</th>
              <th className="py-3 px-4 text-left text-sm font-medium">WhatsApp</th>
              <th className="py-3 px-4 text-left text-sm font-medium">Actividad</th>
              <th className="py-3 px-4 text-left text-sm font-medium">Última Conexión</th>
              <th className="py-3 px-4 text-left text-sm font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => <ClientRow key={client.id} client={client} />)
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  {searchTerm || filter !== 'all'
                    ? 'No se encontraron clientes con los filtros aplicados'
                    : 'No hay clientes registrados'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Información de resultados */}
      {searchTerm || filter !== 'all' ? (
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredClients.length} de {clients.length} clientes
        </div>
      ) : null}
    </div>
  )
}
