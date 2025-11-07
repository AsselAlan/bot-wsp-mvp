'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Truck, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Order } from '@/types';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' ? '/api/bot/orders' : `/api/bot/orders?status=${filter}`;
      const response = await fetch(url);
      const data = await response.json();

      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona todos los pedidos realizados por tus clientes
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todos
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          Pendientes
        </Button>
        <Button
          variant={filter === 'confirmed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('confirmed')}
        >
          Confirmados
        </Button>
        <Button
          variant={filter === 'in_delivery' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('in_delivery')}
        >
          En camino
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
              Los pedidos aparecerán aquí cuando los clientes los realicen
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Pedido #{order.order_number}
                    </CardTitle>
                    <CardDescription>
                      {order.customer_name} • {order.customer_phone}
                    </CardDescription>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Items */}
                  <div>
                    <p className="text-sm font-medium mb-2">Items:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          • {item.cantidad}x {item.producto}
                          {item.detalles && ` (${item.detalles})`}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Dirección */}
                  {order.delivery_address && (
                    <div>
                      <p className="text-sm font-medium mb-1">Dirección:</p>
                      <p className="text-sm text-muted-foreground">
                        {order.delivery_address.calle} {order.delivery_address.numero}
                        {order.delivery_address.piso_depto && `, ${order.delivery_address.piso_depto}`}
                        {' - '}{order.delivery_address.barrio}
                      </p>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">Total:</span>
                    <span className="text-lg font-bold">${order.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
