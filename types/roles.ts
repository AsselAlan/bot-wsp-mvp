// Tipos para el sistema de roles

export type UserRole = 'admin' | 'client'

export interface UserWithRole {
  id: string
  email: string
  role: UserRole
  created_at: string
  subscription_tier: 'free' | 'pro' | 'enterprise'
}

export interface ClientData {
  id: string
  email: string
  role: UserRole
  created_at: string
  subscription_tier: string

  // Datos de conexión WhatsApp
  whatsapp_connected: boolean
  phone_number?: string
  last_connected?: string

  // Datos del bot
  bot_active: boolean
  template_name?: string
  business_name?: string

  // Métricas
  total_messages_today?: number
  pending_orders?: number
  unanswered_messages?: number
}

export interface CreateClientRequest {
  email: string
  password: string
  businessName?: string
  templateId?: string
}

export interface ClientStats {
  total_clients: number
  connected_today: number
  total_orders_today: number
  total_unanswered: number
}
