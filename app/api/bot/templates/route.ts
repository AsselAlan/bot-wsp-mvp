import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TemplateWithOptions } from '@/types';

/**
 * GET /api/bot/templates
 * Lista todas las plantillas de negocio activas con sus opciones
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Obtener plantillas activas
    const { data: templates, error: templatesError } = await supabase
      .from('business_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      return NextResponse.json(
        { error: 'Error al obtener plantillas' },
        { status: 500 }
      );
    }

    if (!templates || templates.length === 0) {
      return NextResponse.json({ templates: [] });
    }

    // Obtener opciones para cada plantilla
    const templatesWithOptions: TemplateWithOptions[] = await Promise.all(
      templates.map(async (template) => {
        const { data: options, error: optionsError } = await supabase
          .from('template_options')
          .select('*')
          .eq('template_id', template.id)
          .order('display_order');

        if (optionsError) {
          console.error(`Error fetching options for template ${template.id}:`, optionsError);
          return { ...template, options: [] };
        }

        return {
          ...template,
          options: options || [],
        };
      })
    );

    return NextResponse.json({ templates: templatesWithOptions });

  } catch (error) {
    console.error('Error in GET /api/bot/templates:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
