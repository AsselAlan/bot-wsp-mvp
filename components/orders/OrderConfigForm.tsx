'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import { OrderConfig, DeliveryZone } from '@/types';

export function OrderConfigForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Partial<OrderConfig>>({
    enable_order_taking: false,
    require_customer_name: true,
    require_delivery_address: true,
    require_payment_method: true,
    delivery_zones: [],
    payment_methods: ['Efectivo', 'Transferencia'],
    order_confirmation_message: '✅ Tu pedido #{order_number} fue recibido. Te llegará en {estimated_time}.',
    missing_info_message: 'Para completar tu pedido necesito que me brindes: {missing_fields}',
    out_of_zone_message: 'Lo siento, no realizamos envíos a esa zona. Nuestras zonas son: {zones}',
    auto_confirm_orders: false,
    request_confirmation: true,
    default_delivery_time: '30-45 minutos',
  });

  const [newZone, setNewZone] = useState({ nombre: '', costo: 0 });
  const [newPaymentMethod, setNewPaymentMethod] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bot/order-config');
      const data = await response.json();

      if (data.config) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading order config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const method = config.id ? 'PUT' : 'POST';

      const response = await fetch('/api/bot/order-config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar');
      }

      setConfig(data.config);
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const addZone = () => {
    if (!newZone.nombre || newZone.costo <= 0) return;

    setConfig({
      ...config,
      delivery_zones: [
        ...(config.delivery_zones || []),
        { ...newZone, activa: true },
      ],
    });
    setNewZone({ nombre: '', costo: 0 });
  };

  const removeZone = (index: number) => {
    setConfig({
      ...config,
      delivery_zones: config.delivery_zones?.filter((_, i) => i !== index),
    });
  };

  const addPaymentMethod = () => {
    if (!newPaymentMethod.trim()) return;

    setConfig({
      ...config,
      payment_methods: [...(config.payment_methods || []), newPaymentMethod],
    });
    setNewPaymentMethod('');
  };

  const removePaymentMethod = (index: number) => {
    setConfig({
      ...config,
      payment_methods: config.payment_methods?.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activación */}
      <Card>
        <CardHeader>
          <CardTitle>Activar Sistema de Pedidos</CardTitle>
          <CardDescription>
            Habilita la toma de pedidos automática a través de WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sistema de Pedidos</p>
              <p className="text-sm text-muted-foreground">
                {config.enable_order_taking ? 'Activado' : 'Desactivado'}
              </p>
            </div>
            <Switch
              checked={config.enable_order_taking}
              onCheckedChange={(checked) =>
                setConfig({ ...config, enable_order_taking: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Zonas de Delivery */}
      <Card>
        <CardHeader>
          <CardTitle>Zonas de Delivery</CardTitle>
          <CardDescription>
            Configura las zonas donde realizas envíos y sus costos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.delivery_zones?.map((zone, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{zone.nombre}</p>
                <p className="text-sm text-muted-foreground">${zone.costo}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeZone(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex gap-3">
            <Input
              placeholder="Nombre de la zona"
              value={newZone.nombre}
              onChange={(e) => setNewZone({ ...newZone, nombre: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Costo"
              value={newZone.costo || ''}
              onChange={(e) => setNewZone({ ...newZone, costo: parseFloat(e.target.value) || 0 })}
            />
            <Button onClick={addZone}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métodos de Pago */}
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pago</CardTitle>
          <CardDescription>
            Define qué métodos de pago aceptas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {config.payment_methods?.map((method, index) => (
              <div key={index} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                <span className="text-sm">{method}</span>
                <button
                  onClick={() => removePaymentMethod(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Input
              placeholder="Nuevo método de pago"
              value={newPaymentMethod}
              onChange={(e) => setNewPaymentMethod(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPaymentMethod()}
            />
            <Button onClick={addPaymentMethod}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mensajes Personalizados */}
      <Card>
        <CardHeader>
          <CardTitle>Mensajes del Bot</CardTitle>
          <CardDescription>
            Personaliza los mensajes que el bot envía durante el proceso de pedido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Mensaje de Confirmación</Label>
            <Textarea
              value={config.order_confirmation_message}
              onChange={(e) =>
                setConfig({ ...config, order_confirmation_message: e.target.value })
              }
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Variables disponibles: {'{order_number}'}, {'{estimated_time}'}
            </p>
          </div>

          <div>
            <Label>Mensaje de Información Faltante</Label>
            <Textarea
              value={config.missing_info_message}
              onChange={(e) =>
                setConfig({ ...config, missing_info_message: e.target.value })
              }
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Variable: {'{missing_fields}'}
            </p>
          </div>

          <div>
            <Label>Tiempo de Entrega por Defecto</Label>
            <Input
              value={config.default_delivery_time}
              onChange={(e) =>
                setConfig({ ...config, default_delivery_time: e.target.value })
              }
              placeholder="ej: 30-45 minutos"
            />
          </div>
        </CardContent>
      </Card>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
