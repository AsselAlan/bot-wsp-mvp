'use client';

import { useState } from 'react';

interface DocumentUploadProps {
  documentType: 'menu' | 'catalog' | 'faq' | 'other';
  onUploadComplete?: (document: any) => void;
  maxSizeMB?: number;
}

export default function DocumentUpload({
  documentType,
  onUploadComplete,
  maxSizeMB = 10,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`El archivo es muy grande. Máximo ${maxSizeMB}MB`);
      return;
    }

    // Validar tipo
    const validTypes = [
      'application/pdf',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];

    if (!validTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Usa PDF, TXT o imágenes (JPG, PNG)');
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);

      // Extraer texto si es PDF o TXT
      let contentText = '';
      if (selectedFile.type === 'text/plain') {
        contentText = await selectedFile.text();
      }
      // TODO: Para PDF necesitaríamos una librería como pdf.js

      // Crear el documento en la base de datos
      // Nota: En producción, primero subirías el archivo a Supabase Storage
      const response = await fetch('/api/bot/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_type: documentType,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          content_text: contentText,
          metadata: {
            uploaded_at: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir documento');
      }

      // Callback de éxito
      if (onUploadComplete) {
        onUploadComplete(data.document);
      }

      // Limpiar
      setSelectedFile(null);

    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err instanceof Error ? err.message : 'Error al subir archivo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Área de selección de archivo */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8
          ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400 bg-white'}
          transition-colors
        `}
      >
        <div className="text-center">
          {/* Icono */}
          <svg
            className={`mx-auto h-12 w-12 ${error ? 'text-red-400' : 'text-gray-400'}`}
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Texto */}
          <div className="mt-4">
            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <>
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500"
                >
                  <span>Seleccionar archivo</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileSelect}
                    accept=".pdf,.txt,.jpg,.jpeg,.png"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  PDF, TXT o imágenes hasta {maxSizeMB}MB
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Botones de acción */}
      {selectedFile && (
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Subiendo...
              </span>
            ) : (
              'Subir archivo'
            )}
          </button>
          <button
            onClick={() => {
              setSelectedFile(null);
              setError(null);
            }}
            disabled={uploading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Sobre los documentos</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Los documentos que subas serán procesados para que el bot pueda responder preguntas específicas sobre su contenido.
                {documentType === 'menu' && ' Por ejemplo, preguntas sobre platos, precios e ingredientes.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
