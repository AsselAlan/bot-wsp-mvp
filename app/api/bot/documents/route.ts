import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/bot/documents
 * Lista los documentos del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Parámetros de consulta
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('type');

    let query = supabase
      .from('business_documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Filtrar por tipo si se especifica
    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    const { data: documents, error: documentsError } = await query;

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return NextResponse.json(
        { error: 'Error al obtener documentos' },
        { status: 500 }
      );
    }

    return NextResponse.json({ documents: documents || [] });

  } catch (error) {
    console.error('Error in GET /api/bot/documents:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bot/documents
 * Crea un nuevo documento (menú, catálogo, etc.)
 * Nota: Por ahora solo guarda metadatos. El archivo se sube a Supabase Storage por separado
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      document_type,
      file_name,
      file_url,
      file_size,
      mime_type,
      content_text,
      metadata = {},
    } = body;

    // Validaciones
    if (!document_type || !file_name) {
      return NextResponse.json(
        { error: 'document_type y file_name son requeridos' },
        { status: 400 }
      );
    }

    const validTypes = ['menu', 'catalog', 'faq', 'other'];
    if (!validTypes.includes(document_type)) {
      return NextResponse.json(
        { error: `document_type debe ser uno de: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Insertar documento
    const { data: document, error: insertError } = await supabase
      .from('business_documents')
      .insert({
        user_id: user.id,
        document_type,
        file_name,
        file_url,
        file_size,
        mime_type,
        content_text,
        metadata,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting document:', insertError);
      return NextResponse.json(
        { error: 'Error al guardar documento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Documento creado exitosamente',
      document,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/bot/documents:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bot/documents
 * Elimina (marca como inactivo) un documento
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { error: 'ID de documento requerido' },
        { status: 400 }
      );
    }

    // Marcar como inactivo (soft delete)
    const { error: updateError } = await supabase
      .from('business_documents')
      .update({ is_active: false })
      .eq('id', documentId)
      .eq('user_id', user.id); // Seguridad: solo puede eliminar sus propios documentos

    if (updateError) {
      console.error('Error deleting document:', updateError);
      return NextResponse.json(
        { error: 'Error al eliminar documento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Documento eliminado exitosamente',
    });

  } catch (error) {
    console.error('Error in DELETE /api/bot/documents:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
