'use client';

import { useState, useEffect } from 'react';
import { TemplateWithOptions } from '@/types';

interface TemplateSelectorProps {
  onSelect: (template: TemplateWithOptions) => void;
  selectedTemplateId?: string | null;
}

export default function TemplateSelector({ onSelect, selectedTemplateId }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateWithOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bot/templates');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar plantillas');
      }

      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-medium">Error al cargar plantillas</p>
        <p className="text-sm text-red-500 mt-2">{error}</p>
        <button
          onClick={fetchTemplates}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No hay plantillas disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Selecciona el tipo de negocio
        </h3>
        <p className="text-sm text-gray-600">
          Elige la plantilla que mejor se adapte a tu negocio. Podrás personalizar todas las opciones después.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className={`
              relative p-6 rounded-lg border-2 transition-all text-left
              ${
                selectedTemplateId === template.id
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-400 hover:shadow-sm'
              }
            `}
          >
            {/* Badge de seleccionado */}
            {selectedTemplateId === template.id && (
              <div className="absolute top-3 right-3">
                <div className="bg-blue-600 text-white rounded-full p-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* Icono */}
            <div className="text-4xl mb-3">{template.icon}</div>

            {/* Nombre */}
            <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>

            {/* Categoría */}
            <p className="text-xs text-gray-500 mb-3">{template.category}</p>

            {/* Descripción */}
            <p className="text-sm text-gray-600 leading-relaxed">
              {template.description}
            </p>

            {/* Número de opciones */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {template.options?.length || 0} opciones configurables
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Opción manual */}
      <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h4 className="text-sm font-medium text-gray-900">¿No encuentras tu tipo de negocio?</h4>
            <p className="mt-1 text-sm text-gray-600">
              Puedes configurar tu bot manualmente sin usar una plantilla. Tendrás control total sobre todas las opciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
