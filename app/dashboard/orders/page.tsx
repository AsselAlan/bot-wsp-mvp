'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Truck, CheckCircle2, XCircle, Loader2, Eye, Bell } from "lucide-react";
import { Order } from '@/types';
import { OrderDetailModal } from '@/components/orders/OrderDetailModal';
import { OrderActions } from '@/components/orders/OrderActions';
import { toast } from 'sonner';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    loadOrders();

    // Auto-refresh cada 30 segundos para detectar pedidos nuevos
    const interval = setInterval(() => {
      loadOrders(true); // true = modo silencioso (no mostrar loading)
    }, 30000);

    return () => clearInterval(interval);
  }, [filter]);

  const loadOrders = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const url = filter === 'all' ? '/api/bot/orders' : `/api/bot/orders?status=${filter}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const newOrders = data.orders || [];

      // Detectar pedidos nuevos (solo si no es la primera carga)
      if (orders.length > 0 && silent) {
        const previousIds = new Set(orders.map(o => o.id));
        const newOrdersList = newOrders.filter((o: Order) => !previousIds.has(o.id));

        if (newOrdersList.length > 0) {
          setNewOrdersCount(prev => prev + newOrdersList.length);

          // Mostrar toast para cada pedido nuevo
          newOrdersList.forEach((order: Order) => {
            toast.success(`Nuevo pedido recibido: #${order.order_number}`, {
              description: `De: ${order.customer_name}`,
              duration: 5000,
            });
          });

          // Opcional: Reproducir sonido de notificación
          playNotificationSound();
        }
      }

      setOrders(newOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      if (!silent) {
        toast.error('Error al cargar pedidos');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const playNotificationSound = () => {
    // Verificar si el usuario quiere sonido (guardado en localStorage)
    const soundEnabled = localStorage.getItem('order_notification_sound') !== 'false';

    if (soundEnabled) {
      // Crear un audio beep simple
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const badges = {
      pending: { label: 'Pendiente', icon: ShoppingCart, color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmado', icon: CheckCircle2, color: 'bg-blue-100 text-blue-800' },
      preparing: { label: 'Preparando', icon: Package, color: 'bg-purple-100 text-purple-800' },
      in_delivery: { label: 'En camino', icon: Truck, color: 'bg-orange-100 text-orange-800' },
      delivered: { label: 'Entregado', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', icon: XCircle, color: 'bg-red-100 text-red-800' },
    };

    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    );
  };

  const getPendingOrdersCount = () => {
    return orders.filter(o => o.status === 'pending').length;
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleStatusChange = () => {
    // Cerrar modal y recargar pedidos
    setShowDetailModal(false);
    loadOrders();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)} hs`;
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const clearNewOrdersBadge = () => {
    setNewOrdersCount(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona todos los pedidos realizados por tus clientes
          </p>
        </div>

        {/* Indicador de pedidos nuevos */}
        {newOrdersCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearNewOrdersBadge}
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            {newOrdersCount} {newOrdersCount === 1 ? 'nuevo' : 'nuevos'}
          </Button>
        )}
      </div>

      {/* Filtros con contador de pendientes */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todos
          {filter !== 'all' && orders.length > 0 && (
            <Badge variant="secondary" className="ml-2">{orders.length}</Badge>
          )}
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
          className="relative"
        >
          Nuevos / Pendientes
          {getPendingOrdersCount() > 0 && (
            <Badge
              variant={filter === 'pending' ? 'secondary' : 'destructive'}
              className="ml-2"
            >
              {getPendingOrdersCount()}
            </Badge>
          )}
        </Button>
        <Button
          variant={filter === 'confirmed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('confirmed')}
        >
          Confirmados
        </Button>
        <Button
          variant={filter === 'preparing' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('preparing')}
        >
          En Preparación
        </Button>
        <Button
          variant={filter === 'in_delivery' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('in_delivery')}
        >
          En Delivery
        </Button>
        <Button
          variant={filter === 'delivered' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('delivered')}
        >
          Completados
        </Button>
      </div>

      {/* Lista de Pedidos */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No hay pedidos</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === 'all'
                ? 'Los pedidos aparecerán aquí cuando los clientes los realicen'
                : `No hay pedidos en estado "${filter}"`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className={order.status === 'pending' ? 'border-yellow-500 border-2' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>Pedido #{order.order_number}</CardTitle>
                      {order.status === 'pending' && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          NUEVO
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {order.customer_name} • {order.customer_phone}
                      <span className="mx-2">•</span>
                      {formatDate(order.created_at)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Items */}
                  <div>
                    <p className="text-sm font-medium mb-2">Productos:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {order.items && order.items.slice(0, 3).map((item: any, idx: number) => (
                        <li key={idx}>
                          • {item.cantidad}x {item.producto}
                          {item.detalles && ` (${item.detalles})`}
                        </li>
                      ))}
                      {order.items && order.items.length > 3 && (
                        <li className="text-xs italic">
                          + {order.items.length - 3} producto(s) más
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Dirección resumida */}
                  {order.delivery_address && order.delivery_address.calle && (
                    <div>
                      <p className="text-sm font-medium mb-1">Dirección:</p>
                      <p className="text-sm text-muted-foreground">
                        {order.delivery_address.calle} {order.delivery_address.numero}
                        {order.delivery_address.barrio && ` - ${order.delivery_address.barrio}`}
                      </p>
                    </div>
                  )}

                  {/* Total y Acciones */}
                  <div className="flex justify-between items-center pt-3 border-t">
                    <div>
                      <span className="text-sm text-muted-foreground">Total:</span>
                      <span className="text-xl font-bold ml-2">${order.total?.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalles
                      </Button>

                      <OrderActions order={order} onStatusChange={handleStatusChange} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Detalles */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </div>
  );
}
