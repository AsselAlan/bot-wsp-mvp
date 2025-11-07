'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TemplateSelector from '@/components/templates/TemplateSelector';
import BusinessOptionsForm from '@/components/templates/BusinessOptionsForm';
import { TemplateWithOptions } from '@/types';
import { applyTemplateToConfig } from '@/lib/templates/template-builder';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithOptions | null>(null);
  const [templateOptions, setTemplateOptions] = useState<Record<string, any>>({});
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    hours: '',
    address: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTemplateSelect = (template: TemplateWithOptions) => {
    setSelectedTemplate(template);
    setStep(2);
  };

  const handleSkipTemplate = () => {
    router.push('/dashboard/config');
  };

  const handleComplete = async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      setError(null);

      // Construir configuración desde la plantilla
      const config = applyTemplateToConfig(selectedTemplate, {
        business_info: businessInfo,
        template_options: templateOptions,
      });

      // Crear configuración
      const response = await fetch('/api/bot/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear configuración');
      }

      // Redirigir al dashboard
      router.push('/dashboard');

    } catch (err) {
      console.error('Error creating config:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración Inicial</h1>
              <p className="mt-1 text-sm text-gray-600">
                Configura tu bot de WhatsApp en pocos pasos
              </p>
            </div>
            <button
              onClick={handleSkipTemplate}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Configurar manualmente
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2
                      ${
                        s === step
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : s < step
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 bg-white text-gray-400'
                      }
                    `}
                  >
                    {s < step ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">{s}</span>
                    )}
                  </div>
                  {s < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        s < step ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-600">Tipo de negocio</span>
              <span className="text-xs text-gray-600">Opciones</span>
              <span className="text-xs text-gray-600">Información</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Step 1: Template Selection */}
          {step === 1 && (
            <TemplateSelector
              onSelect={handleTemplateSelect}
              selectedTemplateId={selectedTemplate?.id}
            />
          )}

          {/* Step 2: Business Options */}
          {step === 2 && selectedTemplate && (
            <div>
              <BusinessOptionsForm
                templateId={selectedTemplate.id}
                initialValues={templateOptions}
                onChange={setTemplateOptions}
              />
              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Atrás
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Business Info */}
          {step === 3 && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Información del Negocio
                </h3>
                <p className="text-sm text-gray-600">
                  Esta información será utilizada por el bot al interactuar con tus clientes
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del negocio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={businessInfo.name}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Pizzería Don Juan"
                  />
                </div>

                <div>
                  <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-2">
                    Horarios de atención
                  </label>
                  <input
                    type="text"
                    id="hours"
                    value={businessInfo.hours}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, hours: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Lunes a Viernes 10:00-22:00, Sábados 11:00-23:00"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Av. Principal 123, Ciudad"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono de contacto
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: +54 11 1234-5678"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
                >
                  Atrás
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading || !businessInfo.name}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando configuración...
                    </span>
                  ) : (
                    'Completar configuración'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
