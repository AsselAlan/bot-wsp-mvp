-- Migración: Tabla para documentos del negocio
-- Fecha: 2025-01-07
-- Descripción: Almacena documentos subidos por los usuarios (menús, catálogos, FAQs, etc.)

-- Tabla: business_documents
CREATE TABLE IF NOT EXISTS public.business_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('menu', 'catalog', 'faq', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  content_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_business_documents_user_id ON public.business_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_business_documents_type ON public.business_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_business_documents_active ON public.business_documents(is_active) WHERE is_active = TRUE;

-- Trigger para updated_at
CREATE TRIGGER update_business_documents_updated_at
  BEFORE UPDATE ON public.business_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE public.business_documents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own documents" ON public.business_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.business_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.business_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.business_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE public.business_documents IS 'Documentos subidos por usuarios (menús, catálogos, etc.) para uso del bot';
COMMENT ON COLUMN public.business_documents.document_type IS 'Tipo de documento: menu, catalog, faq, other';
COMMENT ON COLUMN public.business_documents.file_url IS 'URL del archivo si se almacena en storage (Supabase Storage, S3, etc.)';
COMMENT ON COLUMN public.business_documents.content_text IS 'Contenido extraído del documento en formato texto plano para uso del bot';
COMMENT ON COLUMN public.business_documents.metadata IS 'Metadatos adicionales del documento (número de páginas, idioma, etc.)';
