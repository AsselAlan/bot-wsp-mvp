import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin, getAllClients, getClientStats } from '@/lib/auth/roleHelpers'
import { CreateClientRequest } from '@/types/roles'

/**
 * GET /api/admin/clients
 * Obtiene la lista de todos los clientes (solo admin)
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('stats') === 'true'

    // Obtener clientes
    const clients = await getAllClients()

    // Obtener estadísticas si se solicitan
    let stats = null
    if (includeStats) {
      stats = await getClientStats()
    }

    return NextResponse.json({
      success: true,
      clients,
      stats,
    })
  } catch (error: any) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener clientes',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/clients
 * Crea un nuevo cliente (solo admin)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario sea admin
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }

    const body = (await request.json()) as CreateClientRequest

    // Validar datos requeridos
    if (!body.email || !body.password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Crear usuario en auth.users (Supabase Auth)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirmar email
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        {
          error: authError?.message || 'Error al crear usuario',
        },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // 2. El usuario se crea automáticamente en public.users por el trigger
    // Pero aseguramos que tenga el rol 'client'
    await supabase
      .from('users')
      .update({ role: 'client' })
      .eq('id', userId)

    // 3. Crear bot_config inicial si se proporciona template o businessName
    if (body.templateId || body.businessName) {
      // Obtener configuración de template si se proporcionó
      let templateConfig: any = {
        main_context: 'Eres un asistente virtual amable y servicial.',
        business_info: {
          name: body.businessName || '',
          hours: '',
          address: '',
          phone: '',
        },
        selected_template_id: body.templateId || null,
      }

      if (body.templateId) {
        const { data: template } = await supabase
          .from('business_templates')
          .select('*')
          .eq('id', body.templateId)
          .single()

        if (template) {
          templateConfig = {
            main_context: template.default_main_context,
            business_info: {
              name: body.businessName || '',
              hours: '',
              address: '',
              phone: '',
            },
            openai_model: 'gpt-4o-mini',
            temperature: 0.7,
            is_active: false, // Inactivo hasta que conecte WhatsApp
            tone: template.default_tone,
            use_emojis: template.default_use_emojis,
            strict_mode: template.default_strict_mode,
            response_length: template.default_response_length,
            selected_template_id: body.templateId,
            template_options: {},
          }
        }
      }

      // Insertar bot_config
      const { error: configError } = await supabase.from('bot_configs').insert({
        user_id: userId,
        ...templateConfig,
      })

      if (configError) {
        console.error('Error creating bot config:', configError)
      }

      // Si el template soporta pedidos, crear order_config
      if (body.templateId) {
        const { data: template } = await supabase
          .from('business_templates')
          .select('supports_orders')
          .eq('id', body.templateId)
          .single()

        if (template?.supports_orders) {
          await supabase.from('order_config').insert({
            user_id: userId,
            enable_order_taking: false, // Admin debe activarlo
          })
        }
      }
    } else {
      // Crear bot_config básico por defecto
      await supabase.from('bot_configs').insert({
        user_id: userId,
        main_context: 'Eres un asistente virtual amable y servicial.',
        business_info: {
          name: '',
          hours: '',
          address: '',
          phone: '',
        },
        is_active: false,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Cliente creado exitosamente',
      client: {
        id: userId,
        email: body.email,
      },
    })
  } catch (error: any) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al crear cliente',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/clients/[id]
 * Elimina un cliente (solo admin) - Implementar si es necesario
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('id')

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Eliminar usuario (cascade eliminará todo lo relacionado)
    const { error } = await supabase.auth.admin.deleteUser(clientId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
    })
  } catch (error: any) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al eliminar cliente',
      },
      { status: 500 }
    )
  }
}
