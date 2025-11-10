'use client';

import { Order } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, MapPin, CreditCard, User, Calendar, MessageSquare } from 'lucide-react';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  if (!order) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendiente', variant: 'outline' },
      confirmed: { label: 'Confirmado', variant: 'default' },
      preparing: { label: 'En Preparación', variant: 'secondary' },
      in_delivery: { label: 'En Delivery', variant: 'default' },
      delivered: { label: 'Entregado', variant: 'secondary' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendiente', variant: 'outline' },
      paid: { label: 'Pagado', variant: 'default' },
      failed: { label: 'Fallido', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Pedido #{order.order_number}</DialogTitle>
            {getStatusBadge(order.status)}
          </div>
          <DialogDescription>
            Creado el {formatDate(order.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Cliente */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4" />
              <h3 className="font-semibold">Cliente</h3>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Nombre:</span> {order.customer_name}</p>
              <p><span className="font-medium">Teléfono:</span> {order.customer_phone}</p>
            </div>
          </div>

          <Separator />

          {/* Productos */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4" />
              <h3 className="font-semibold">Productos</h3>
            </div>
            <div className="space-y-2">
              {order.items && order.items.length > 0 ? (
                order.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-start text-sm border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">
                        {item.cantidad}x {item.producto}
                      </p>
                      {item.detalles && (
                        <p className="text-muted-foreground text-xs">{item.detalles}</p>
                      )}
                    </div>
                    {item.precio && (
                      <p className="font-medium">${(item.precio * item.cantidad).toFixed(2)}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay productos registrados</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Dirección de Entrega */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4" />
              <h3 className="font-semibold">Dirección de Entrega</h3>
            </div>
            <div className="text-sm space-y-1">
              {order.delivery_address && Object.keys(order.delivery_address).length > 0 ? (
                <>
                  {order.delivery_address.calle && order.delivery_address.numero && (
                    <p>{order.delivery_address.calle} {order.delivery_address.numero}</p>
                  )}
                  {order.delivery_address.piso_depto && (
                    <p>Piso/Depto: {order.delivery_address.piso_depto}</p>
                  )}
                  {order.delivery_address.barrio && (
                    <p>Barrio: {order.delivery_address.barrio}</p>
                  )}
                  {order.delivery_address.zona && (
                    <p>Zona: {order.delivery_address.zona}</p>
                  )}
                  {order.delivery_address.referencias && (
                    <p className="text-muted-foreground">Ref: {order.delivery_address.referencias}</p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No especificada</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Información de Pago */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4" />
              <h3 className="font-semibold">Información de Pago</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Método de pago:</span>
                <span className="font-medium">{order.payment_method || 'No especificado'}</span>
              </div>
              <div className="flex justify-between">
                <span>Estado de pago:</span>
                {getPaymentStatusBadge(order.payment_status)}
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${order.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Costo de envío:</span>
                <span>${order.delivery_cost?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between font-bold text-base">
                <span>Total:</span>
                <span>${order.total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Notas del Cliente */}
          {order.customer_notes && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4" />
                  <h3 className="font-semibold">Notas del Cliente</h3>
                </div>
                <p className="text-sm text-muted-foreground">{order.customer_notes}</p>
              </div>
            </>
          )}

          {/* Notas Internas */}
          {order.internal_notes && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4" />
                  <h3 className="font-semibold">Notas Internas</h3>
                </div>
                <p className="text-sm">{order.internal_notes}</p>
              </div>
            </>
          )}

          {/* Información Adicional */}
          <Separator />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" />
              <h3 className="font-semibold">Información Adicional</h3>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Tiempo estimado:</span> {order.estimated_delivery_time}</p>
              {order.confirmed_at && (
                <p><span className="font-medium">Confirmado:</span> {formatDate(order.confirmed_at)}</p>
              )}
              {order.delivery_time && (
                <p><span className="font-medium">Entregado:</span> {formatDate(order.delivery_time)}</p>
              )}
              {order.cancelled_at && (
                <>
                  <p><span className="font-medium">Cancelado:</span> {formatDate(order.cancelled_at)}</p>
                  {order.cancellation_reason && (
                    <p className="text-muted-foreground">Razón: {order.cancellation_reason}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Snapshot de Conversación (si existe) */}
          {order.conversation_snapshot && Object.keys(order.conversation_snapshot).length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4" />
                  <h3 className="font-semibold">Conversación del Pedido</h3>
                </div>
                <div className="bg-muted p-3 rounded-md text-sm space-y-2 max-h-60 overflow-y-auto">
                  {Object.entries(order.conversation_snapshot).map(([key, value]: [string, any]) => (
                    value.user_message && (
                      <div key={key} className="space-y-1">
                        <p className="font-medium text-primary">Cliente: {value.user_message}</p>
                        {value.bot_response && (
                          <p className="text-muted-foreground">Bot: {value.bot_response}</p>
                        )}
                      </div>
                    )
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
