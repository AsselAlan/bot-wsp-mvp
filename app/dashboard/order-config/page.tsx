'use client';

import { OrderConfigForm } from '@/components/orders/OrderConfigForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OrderConfigPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Pedidos
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración de Pedidos</h1>
        <p className="text-muted-foreground mt-1">
          Configura cómo el bot maneja los pedidos de tus clientes
        </p>
      </div>

      <OrderConfigForm />
    </div>
  );
}
