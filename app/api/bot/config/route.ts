import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/server';
import { generateFullContext } from '@/lib/templates/template-builder';

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
      openai_api_key,
      notification_number,
      enable_unanswered_notifications,
      custom_instructions,
      selected_template_id,
      template_options
    } = body;

    const supabase = await createClient();

    // Si hay template seleccionado, generar contexto automáticamente
    let generatedContext = '';
    let templateDefaults: any = {};

    if (selected_template_id && template_options) {
      // Obtener template de la base de datos
      const { data: template, error: templateError } = await supabase
        .from('business_templates')
        .select('*')
        .eq('id', selected_template_id)
        .single();

      if (templateError || !template) {
        return NextResponse.json(
          { success: false, error: 'Template no encontrado' },
          { status: 400 }
        );
      }

      // Generar contexto completo automáticamente
      generatedContext = generateFullContext(template, template_options, custom_instructions);

      // Usar defaults de la plantilla para configuraciones técnicas
      templateDefaults = {
        tone: template.default_tone,
        use_emojis: template.default_use_emojis,
        response_length: template.default_response_length,
        strict_mode: template.default_strict_mode,
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Debes seleccionar una plantilla de negocio' },
        { status: 400 }
      );
    }

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

    // Crear configuración con contexto generado automáticamente
    const { data, error } = await supabase
      .from('bot_configs')
      .insert({
        user_id: userId,
        main_context: generatedContext, // ← GENERADO AUTOMÁTICAMENTE
        business_info: {
          name: template_options.business_name || '',
          hours: template_options.business_hours || '',
          address: template_options.business_address || '',
          phone: template_options.business_phone || ''
        },
        openai_model: 'gpt-4o-mini', // Modelo por defecto
        openai_api_key: openai_api_key || null,
        temperature: 0.7, // Temperatura fija
        is_active: true,
        notification_number: notification_number || null,
        enable_unanswered_notifications: enable_unanswered_notifications || false,
        // Configuraciones técnicas (de la plantilla, no editables)
        tone: templateDefaults.tone,
        use_emojis: templateDefaults.use_emojis,
        strict_mode: templateDefaults.strict_mode,
        response_length: templateDefaults.response_length,
        custom_instructions: custom_instructions || '',
        selected_template_id,
        template_options
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
      openai_api_key,
      is_active,
      notification_number,
      enable_unanswered_notifications,
      custom_instructions,
      selected_template_id,
      template_options
    } = body;

    const supabase = await createClient();

    // Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Regenerar contexto si cambiaron las opciones de template o instrucciones
    if ((selected_template_id !== undefined && template_options !== undefined) || custom_instructions !== undefined) {
      // Obtener la template actual o la nueva
      const templateId = selected_template_id !== undefined ? selected_template_id : (await supabase.from('bot_configs').select('selected_template_id').eq('user_id', userId).single()).data?.selected_template_id;

      if (templateId) {
        const { data: template } = await supabase
          .from('business_templates')
          .select('*')
          .eq('id', templateId)
          .single();

        if (template) {
          // Obtener template_options actual si no se proveyó
          const currentOptions = template_options !== undefined ? template_options : (await supabase.from('bot_configs').select('template_options').eq('user_id', userId).single()).data?.template_options;
          const currentCustom = custom_instructions !== undefined ? custom_instructions : (await supabase.from('bot_configs').select('custom_instructions').eq('user_id', userId).single()).data?.custom_instructions;

          // Regenerar contexto
          updateData.main_context = generateFullContext(template, currentOptions, currentCustom);

          // Actualizar business_info desde template_options
          if (currentOptions) {
            updateData.business_info = {
              name: currentOptions.business_name || '',
              hours: currentOptions.business_hours || '',
              address: currentOptions.business_address || '',
              phone: currentOptions.business_phone || ''
            };
          }

          // Actualizar configuraciones técnicas de la plantilla
          updateData.tone = template.default_tone;
          updateData.use_emojis = template.default_use_emojis;
          updateData.response_length = template.default_response_length;
          updateData.strict_mode = template.default_strict_mode;
        }
      }
    }

    if (openai_api_key !== undefined) updateData.openai_api_key = openai_api_key;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (notification_number !== undefined) updateData.notification_number = notification_number;
    if (enable_unanswered_notifications !== undefined) updateData.enable_unanswered_notifications = enable_unanswered_notifications;
    if (custom_instructions !== undefined) updateData.custom_instructions = custom_instructions;
    if (selected_template_id !== undefined) updateData.selected_template_id = selected_template_id;
    if (template_options !== undefined) updateData.template_options = template_options;

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
