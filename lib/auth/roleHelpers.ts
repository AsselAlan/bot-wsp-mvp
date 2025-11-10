import { createClient } from '@/lib/supabase/server'
import { UserRole, ClientData, ClientStats } from '@/types/roles'
import { User } from '@/types'

/**
 * Obtiene el rol del usuario actual autenticado
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  return userData?.role || null
}

/**
 * Obtiene los datos completos del usuario actual
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return userData
}

/**
 * Verifica si el usuario actual es admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'admin'
}

/**
 * Verifica si el usuario actual puede editar la configuración de un usuario específico
 * Los admins pueden editar cualquier configuración, los clientes solo la suya
 */
export async function canEditConfig(targetUserId: string): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  // Si es el mismo usuario, puede editar
  if (user.id === targetUserId) return true

  // Si no, verificar si es admin
  return await isAdmin()
}

/**
 * Obtiene la lista de todos los clientes (solo para admins)
 */
export async function getAllClients(): Promise<ClientData[]> {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error('Unauthorized: Only admins can view all clients')
  }

  const supabase = await createClient()

  // Obtener todos los usuarios con rol 'client'
  const { data: clients, error: clientsError } = await supabase
    .from('users')
    .select('id, email, role, created_at, subscription_tier')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  if (clientsError || !clients) {
    return []
  }

  // Para cada cliente, obtener su información adicional
  const clientsWithData = await Promise.all(
    clients.map(async (client) => {
      // Conexión WhatsApp
      const { data: connection } = await supabase
        .from('whatsapp_connections')
        .select('is_connected, phone_number, last_connected')
        .eq('user_id', client.id)
        .single()

      // Bot config
      const { data: botConfig } = await supabase
        .from('bot_configs')
        .select('is_active, selected_template_id')
        .eq('user_id', client.id)
        .single()

      // Template name
      let templateName: string | undefined
      if (botConfig?.selected_template_id) {
        const { data: template } = await supabase
          .from('business_templates')
          .select('name')
          .eq('id', botConfig.selected_template_id)
          .single()
        templateName = template?.name
      }

      // Business name from bot_configs
      const { data: businessInfo } = await supabase
        .from('bot_configs')
        .select('business_info')
        .eq('user_id', client.id)
        .single()

      // Métricas del día
      const today = new Date().toISOString().split('T')[0]
      const { data: metrics } = await supabase
        .from('chat_metrics')
        .select('daily_chats')
        .eq('user_id', client.id)
        .eq('date', today)
        .single()

      // Pedidos pendientes
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', client.id)
        .eq('status', 'pending')

      // Mensajes sin responder
      const { count: unansweredMessages } = await supabase
        .from('unanswered_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', client.id)
        .eq('is_reviewed', false)

      return {
        id: client.id,
        email: client.email,
        role: client.role,
        created_at: client.created_at,
        subscription_tier: client.subscription_tier,
        whatsapp_connected: connection?.is_connected || false,
        phone_number: connection?.phone_number || undefined,
        last_connected: connection?.last_connected || undefined,
        bot_active: botConfig?.is_active || false,
        template_name: templateName,
        business_name: businessInfo?.business_info?.name || undefined,
        total_messages_today: metrics?.daily_chats || 0,
        pending_orders: pendingOrders || 0,
        unanswered_messages: unansweredMessages || 0,
      } as ClientData
    })
  )

  return clientsWithData
}

/**
 * Obtiene estadísticas globales de todos los clientes (solo para admins)
 */
export async function getClientStats(): Promise<ClientStats> {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error('Unauthorized: Only admins can view client stats')
  }

  const supabase = await createClient()

  // Total de clientes
  const { count: totalClients } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'client')

  // Clientes conectados hoy
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: connectedToday } = await supabase
    .from('whatsapp_connections')
    .select('*', { count: 'exact', head: true })
    .gte('last_connected', today.toISOString())

  // Total de pedidos del día (de todos los clientes)
  const todayDate = new Date().toISOString().split('T')[0]

  const { count: totalOrdersToday } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${todayDate}T00:00:00`)

  // Total de mensajes sin responder (de todos los clientes)
  const { count: totalUnanswered } = await supabase
    .from('unanswered_messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_reviewed', false)

  return {
    total_clients: totalClients || 0,
    connected_today: connectedToday || 0,
    total_orders_today: totalOrdersToday || 0,
    total_unanswered: totalUnanswered || 0,
  }
}

/**
 * Obtiene un cliente específico por ID (solo para admins)
 */
export async function getClientById(clientId: string): Promise<ClientData | null> {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error('Unauthorized: Only admins can view client details')
  }

  const clients = await getAllClients()
  return clients.find((c) => c.id === clientId) || null
}

/**
 * Verifica si un usuario puede acceder a los datos de otro usuario
 */
export async function canAccessUserData(targetUserId: string): Promise<boolean> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  // Si es el mismo usuario, puede acceder
  if (user.id === targetUserId) return true

  // Si no, verificar si es admin
  return await isAdmin()
}
