'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ClientData } from '@/types/roles'

interface AdminContextType {
  selectedClient: ClientData | null
  setSelectedClient: (client: ClientData | null) => void
  isAdminView: boolean
  clients: ClientData[]
  setClients: (clients: ClientData[]) => void
  refreshClients: () => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
  const [clients, setClients] = useState<ClientData[]>([])
  const [isAdminView, setIsAdminView] = useState(false)

  // Cargar clientes al montar
  const refreshClients = async () => {
    try {
      const response = await fetch('/api/admin/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
        setIsAdminView(true)
      } else {
        setIsAdminView(false)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      setIsAdminView(false)
    }
  }

  useEffect(() => {
    refreshClients()
  }, [])

  // Guardar cliente seleccionado en localStorage
  useEffect(() => {
    if (selectedClient) {
      localStorage.setItem('selectedClientId', selectedClient.id)
    } else {
      localStorage.removeItem('selectedClientId')
    }
  }, [selectedClient])

  // Restaurar cliente seleccionado desde localStorage
  useEffect(() => {
    const savedClientId = localStorage.getItem('selectedClientId')
    if (savedClientId && clients.length > 0) {
      const client = clients.find((c) => c.id === savedClientId)
      if (client) {
        setSelectedClient(client)
      }
    }
  }, [clients])

  return (
    <AdminContext.Provider
      value={{
        selectedClient,
        setSelectedClient,
        isAdminView,
        clients,
        setClients,
        refreshClients,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
