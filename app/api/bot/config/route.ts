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
      template_options,
      business_name,
      business_description,
      business_address,
      business_phone,
      business_email,
      business_website,
      social_networks,
      business_hours,
      use_emojis,
      message_tone,
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
      const businessConfig = {
        business_name,
        business_description,
        business_address,
        business_phone,
        business_email,
        business_website,
        social_networks,
        business_hours,
        use_emojis,
        message_tone,
      };

      generatedContext = generateFullContext(
        template,
        template_options,
        businessConfig,
        custom_instructions
      );

      // Usar defaults de la plantilla para configuraciones técnicas
      templateDefaults = {
        tone: message_tone || template.default_tone,
        use_emojis: use_emojis !== undefined ? use_emojis : template.default_use_emojis,
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
        business_name: business_name || '',
        business_description: business_description || '',
        business_address: business_address || '',
        business_phone: business_phone || '',
        business_email: business_email || '',
        business_website: business_website || '',
        social_networks: social_networks || '',
        business_hours: business_hours || '',
        business_info: {
          name: business_name || '',
          hours: business_hours || '',
          address: business_address || '',
          phone: business_phone || ''
        },
        openai_model: 'gpt-4o-mini', // Modelo por defecto
        openai_api_key: openai_api_key || null,
        temperature: 0.7, // Temperatura fija
        is_active: true,
        notification_number: notification_number || null,
        enable_unanswered_notifications: enable_unanswered_notifications || false,
        // Configuraciones técnicas (de la plantilla, no editables)
        tone: templateDefaults.tone,
        message_tone: message_tone || 'amigable',
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
      template_options,
      business_name,
      business_description,
      business_address,
      business_phone,
      business_email,
      business_website,
      social_networks,
      business_hours,
      use_emojis,
      message_tone,
    } = body;

    const supabase = await createClient();

    // Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Regenerar contexto si cambiaron las opciones de template, configuraciones de negocio o instrucciones
    const needsRegeneration = selected_template_id !== undefined || template_options !== undefined ||
      custom_instructions !== undefined || business_name !== undefined || business_description !== undefined ||
      business_address !== undefined || business_phone !== undefined || business_email !== undefined ||
      business_website !== undefined || social_networks !== undefined || business_hours !== undefined ||
      use_emojis !== undefined || message_tone !== undefined;

    if (needsRegeneration) {
      // Obtener configuración actual
      const { data: currentConfig } = await supabase
        .from('bot_configs')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (currentConfig) {
        // Obtener la template actual o la nueva
        const templateId = selected_template_id !== undefined ? selected_template_id : currentConfig.selected_template_id;

        if (templateId) {
          const { data: template } = await supabase
            .from('business_templates')
            .select('*')
            .eq('id', templateId)
            .single();

          if (template) {
            // Obtener valores actuales o nuevos
            const currentOptions = template_options !== undefined ? template_options : currentConfig.template_options;
            const currentCustom = custom_instructions !== undefined ? custom_instructions : currentConfig.custom_instructions;

            // Preparar businessConfig con valores nuevos o actuales
            const businessConfig = {
              business_name: business_name !== undefined ? business_name : currentConfig.business_name,
              business_description: business_description !== undefined ? business_description : currentConfig.business_description,
              business_address: business_address !== undefined ? business_address : currentConfig.business_address,
              business_phone: business_phone !== undefined ? business_phone : currentConfig.business_phone,
              business_email: business_email !== undefined ? business_email : currentConfig.business_email,
              business_website: business_website !== undefined ? business_website : currentConfig.business_website,
              social_networks: social_networks !== undefined ? social_networks : currentConfig.social_networks,
              business_hours: business_hours !== undefined ? business_hours : currentConfig.business_hours,
              use_emojis: use_emojis !== undefined ? use_emojis : currentConfig.use_emojis,
              message_tone: message_tone !== undefined ? message_tone : currentConfig.message_tone,
            };

            // Regenerar contexto
            updateData.main_context = generateFullContext(
              template,
              currentOptions,
              businessConfig,
              currentCustom
            );

            // Actualizar business_info
            updateData.business_info = {
              name: businessConfig.business_name || '',
              hours: businessConfig.business_hours || '',
              address: businessConfig.business_address || '',
              phone: businessConfig.business_phone || ''
            };

            // Actualizar configuraciones técnicas
            updateData.tone = businessConfig.message_tone || template.default_tone;
            updateData.message_tone = businessConfig.message_tone || currentConfig.message_tone || 'amigable';
            updateData.use_emojis = businessConfig.use_emojis !== undefined ? businessConfig.use_emojis : template.default_use_emojis;
            updateData.response_length = template.default_response_length;
            updateData.strict_mode = template.default_strict_mode;
          }
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

    // Actualizar campos de configuración principal
    if (business_name !== undefined) updateData.business_name = business_name;
    if (business_description !== undefined) updateData.business_description = business_description;
    if (business_address !== undefined) updateData.business_address = business_address;
    if (business_phone !== undefined) updateData.business_phone = business_phone;
    if (business_email !== undefined) updateData.business_email = business_email;
    if (business_website !== undefined) updateData.business_website = business_website;
    if (social_networks !== undefined) updateData.social_networks = social_networks;
    if (business_hours !== undefined) updateData.business_hours = business_hours;

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
