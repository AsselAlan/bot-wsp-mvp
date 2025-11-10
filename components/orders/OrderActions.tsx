'use client';

import { useState } from 'react';
import { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Check, X, ChefHat, Truck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface OrderActionsProps {
  order: Order;
  onStatusChange?: () => void;
}

export function OrderActions({ order, onStatusChange }: OrderActionsProps) {
  const [loading, setLoading] = useState(false);

  const updateOrderStatus = async (newStatus: string, notifyClient = true) => {
    setLoading(true);

    try {
      const response = await fetch('/api/bot/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: order.id,
          status: newStatus,
          notify_client: notifyClient,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar pedido');
      }

      toast.success(data.message || 'Pedido actualizado correctamente');

      // Llamar al callback para refrescar la lista
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error: any) {
      console.error('Error al actualizar pedido:', error);
      toast.error(error.message || 'Error al actualizar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableActions = () => {
    const actions = [];

    switch (order.status) {
      case 'pending':
        actions.push(
          <Button
            key="confirm"
            size="sm"
            variant="default"
            onClick={() => updateOrderStatus('confirmed')}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirmar Pedido
          </Button>
        );
        actions.push(
          <Button
            key="cancel"
            size="sm"
            variant="destructive"
            onClick={() => updateOrderStatus('cancelled')}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Rechazar
          </Button>
        );
        break;

      case 'confirmed':
        actions.push(
          <Button
            key="prepare"
            size="sm"
            variant="default"
            onClick={() => updateOrderStatus('preparing')}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <ChefHat className="w-4 h-4" />
            Marcar en Preparación
          </Button>
        );
        actions.push(
          <Button
            key="cancel"
            size="sm"
            variant="outline"
            onClick={() => updateOrderStatus('cancelled')}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancelar
          </Button>
        );
        break;

      case 'preparing':
        actions.push(
          <Button
            key="delivery"
            size="sm"
            variant="default"
            onClick={() => updateOrderStatus('in_delivery')}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            Marcar en Delivery
          </Button>
        );
        break;

      case 'in_delivery':
        actions.push(
          <Button
            key="delivered"
            size="sm"
            variant="default"
            onClick={() => updateOrderStatus('delivered')}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Marcar como Entregado
          </Button>
        );
        break;

      case 'delivered':
      case 'cancelled':
        // No hay acciones disponibles para pedidos completados o cancelados
        return null;
    }

    return actions;
  };

  const actions = getAvailableActions();

  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions}
    </div>
  );
}
