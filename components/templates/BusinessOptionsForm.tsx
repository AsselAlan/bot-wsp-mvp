'use client';

import { useState, useEffect } from 'react';
import { TemplateOption } from '@/types';

interface BusinessOptionsFormProps {
  templateId: string;
  initialValues?: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}

export default function BusinessOptionsForm({
  templateId,
  initialValues = {},
  onChange,
}: BusinessOptionsFormProps) {
  const [options, setOptions] = useState<TemplateOption[]>([]);
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (templateId) {
      fetchTemplateOptions();
    }
  }, [templateId]);

  const fetchTemplateOptions = async () => {
    try {
      setLoading(true);
      // Primero obtenemos la plantilla por ID buscándola en todas las plantillas
      const response = await fetch('/api/bot/templates');
      const data = await response.json();

      const template = data.templates?.find((t: any) => t.id === templateId);

      if (template && template.options) {
        setOptions(template.options);
      }
    } catch (error) {
      console.error('Error fetching template options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    const newValues = { ...values, [key]: value };
    setValues(newValues);
    onChange(newValues);
  };

  const renderField = (option: TemplateOption) => {
    const value = values[option.option_key];

    switch (option.field_type) {
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={option.option_key}
              checked={value || false}
              onChange={(e) => handleChange(option.option_key, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor={option.option_key} className="ml-2 text-sm font-medium text-gray-900">
              {option.option_label}
            </label>
            {option.option_description && (
              <p className="ml-6 text-xs text-gray-500 mt-1">{option.option_description}</p>
            )}
          </div>
        );

      case 'text':
        return (
          <div>
            <label htmlFor={option.option_key} className="block text-sm font-medium text-gray-700 mb-1">
              {option.option_label}
              {option.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {option.option_description && (
              <p className="text-xs text-gray-500 mb-2">{option.option_description}</p>
            )}
            <input
              type="text"
              id={option.option_key}
              value={value || ''}
              onChange={(e) => handleChange(option.option_key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Ingresa ${option.option_label.toLowerCase()}`}
            />
          </div>
        );

      case 'textarea':
        return (
          <div>
            <label htmlFor={option.option_key} className="block text-sm font-medium text-gray-700 mb-1">
              {option.option_label}
              {option.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {option.option_description && (
              <p className="text-xs text-gray-500 mb-2">{option.option_description}</p>
            )}
            <textarea
              id={option.option_key}
              value={value || ''}
              onChange={(e) => handleChange(option.option_key, e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Ingresa ${option.option_label.toLowerCase()}`}
            />
          </div>
        );

      case 'url':
        return (
          <div>
            <label htmlFor={option.option_key} className="block text-sm font-medium text-gray-700 mb-1">
              {option.option_label}
              {option.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {option.option_description && (
              <p className="text-xs text-gray-500 mb-2">{option.option_description}</p>
            )}
            <input
              type="url"
              id={option.option_key}
              value={value || ''}
              onChange={(e) => handleChange(option.option_key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://ejemplo.com"
            />
          </div>
        );

      case 'select':
        const selectOptions = option.field_options || [];
        return (
          <div>
            <label htmlFor={option.option_key} className="block text-sm font-medium text-gray-700 mb-1">
              {option.option_label}
              {option.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {option.option_description && (
              <p className="text-xs text-gray-500 mb-2">{option.option_description}</p>
            )}
            <div className="space-y-2">
              {selectOptions.map((opt) => (
                <label key={opt} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(value || []).includes(opt)}
                    onChange={(e) => {
                      const currentValues = value || [];
                      const newValues = e.target.checked
                        ? [...currentValues, opt]
                        : currentValues.filter((v: string) => v !== opt);
                      handleChange(option.option_key, newValues);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'file':
        return (
          <div>
            <label htmlFor={option.option_key} className="block text-sm font-medium text-gray-700 mb-1">
              {option.option_label}
              {option.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {option.option_description && (
              <p className="text-xs text-gray-500 mb-2">{option.option_description}</p>
            )}
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <div className="text-sm text-gray-600">
                  <label
                    htmlFor={option.option_key}
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500"
                  >
                    <span>Subir archivo</span>
                    <input
                      id={option.option_key}
                      type="file"
                      className="sr-only"
                      onChange={(e) => {
                        // TODO: Implementar upload a Supabase Storage
                        console.log('File selected:', e.target.files?.[0]);
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PDF, TXT hasta 10MB</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600">No hay opciones configurables para esta plantilla</p>
      </div>
    );
  }

  // Agrupar opciones por categoría
  const categorizedOptions = options.reduce((acc, option) => {
    const category = option.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(option);
    return acc;
  }, {} as Record<string, TemplateOption[]>);

  const categoryLabels: Record<string, string> = {
    menu: 'Menú',
    pedidos: 'Pedidos',
    delivery: 'Delivery',
    pagos: 'Pagos',
    general: 'Información General',
  };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Opciones de Negocio
        </h3>
        <p className="text-sm text-gray-600">
          Activa y configura las opciones que necesites para tu negocio
        </p>
      </div>

      {Object.entries(categorizedOptions).map(([category, categoryOptions]) => (
        <div key={category} className="border-b border-gray-200 pb-8 last:border-0">
          <h4 className="text-md font-semibold text-gray-900 mb-4 uppercase tracking-wide">
            {categoryLabels[category] || category}
          </h4>
          <div className="space-y-6">
            {categoryOptions.map((option) => (
              <div key={option.id} className="bg-gray-50 p-4 rounded-lg">
                {renderField(option)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
