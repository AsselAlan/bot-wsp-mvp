import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: Obtener configuración del bot
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Obtener configuración del bot
    const { data, error } = await supabase
      .from('bot_configs')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Si no existe, retornar configuración por defecto
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No hay configuración aún'
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener configuración',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// POST: Crear nueva configuración
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      main_context,
      business_info,
      openai_model,
      openai_api_key,
      temperature,
      notification_number,
      enable_unanswered_notifications,
      tone,
      use_emojis,
      strict_mode,
      response_length,
      custom_instructions
    } = body;

    // Validaciones
    if (!main_context || main_context.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El contexto principal es requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar si ya existe configuración
    const { data: existing } = await supabase
      .from('bot_configs')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una configuración. Usa PUT para actualizar.' },
        { status: 400 }
      );
    }

    // Crear configuración
    const { data, error } = await supabase
      .from('bot_configs')
      .insert({
        user_id: userId,
        main_context,
        business_info: business_info || {
          name: '',
          hours: '',
          address: '',
          phone: ''
        },
        openai_model: openai_model || 'gpt-3.5-turbo',
        openai_api_key: openai_api_key || null,
        temperature: temperature || 0.7,
        is_active: true,
        notification_number: notification_number || null,
        enable_unanswered_notifications: enable_unanswered_notifications || false,
        tone: tone || 'friendly',
        use_emojis: use_emojis || 'moderate',
        strict_mode: strict_mode ?? true,
        response_length: response_length || 'medium',
        custom_instructions: custom_instructions || ''
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Configuración creada exitosamente'
    });

  } catch (error) {
    console.error('Error al crear configuración:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear configuración',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// PUT: Actualizar configuración existente
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      main_context,
      business_info,
      openai_model,
      openai_api_key,
      temperature,
      is_active,
      notification_number,
      enable_unanswered_notifications,
      tone,
      use_emojis,
      strict_mode,
      response_length,
      custom_instructions
    } = body;

    const supabase = await createClient();

    // Preparar datos para actualizar (solo campos proporcionados)
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (main_context !== undefined) updateData.main_context = main_context;
    if (business_info !== undefined) updateData.business_info = business_info;
    if (openai_model !== undefined) updateData.openai_model = openai_model;
    if (openai_api_key !== undefined) updateData.openai_api_key = openai_api_key;
    if (temperature !== undefined) updateData.temperature = temperature;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (notification_number !== undefined) updateData.notification_number = notification_number;
    if (enable_unanswered_notifications !== undefined) updateData.enable_unanswered_notifications = enable_unanswered_notifications;
    if (tone !== undefined) updateData.tone = tone;
    if (use_emojis !== undefined) updateData.use_emojis = use_emojis;
    if (strict_mode !== undefined) updateData.strict_mode = strict_mode;
    if (response_length !== undefined) updateData.response_length = response_length;
    if (custom_instructions !== undefined) updateData.custom_instructions = custom_instructions;

    // Actualizar configuración
    const { data, error } = await supabase
      .from('bot_configs')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Configuración actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar configuración',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
