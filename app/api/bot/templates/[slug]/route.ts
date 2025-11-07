import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/bot/templates/[slug]
 * Obtiene los detalles de una plantilla específica con sus opciones
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const supabase = await createClient();

    // Obtener plantilla por slug
    const { data: template, error: templateError } = await supabase
      .from('business_templates')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    // Obtener opciones de la plantilla
    const { data: options, error: optionsError } = await supabase
      .from('template_options')
      .select('*')
      .eq('template_id', template.id)
      .order('display_order');

    if (optionsError) {
      console.error('Error fetching template options:', optionsError);
      return NextResponse.json(
        { error: 'Error al obtener opciones de la plantilla' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      template: {
        ...template,
        options: options || [],
      },
    });

  } catch (error) {
    console.error('Error in GET /api/bot/templates/[slug]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
