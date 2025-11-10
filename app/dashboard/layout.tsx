'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, LayoutDashboard, Wifi, Settings, LogOut, AlertCircle, Sliders, Workflow, ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [supportsOrders, setSupportsOrders] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkIfTemplateSupportsOrders();
  }, []);

  const checkIfTemplateSupportsOrders = async () => {
    try {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No hay usuario autenticado');
        setLoading(false);
        return;
      }

      console.log('✅ Usuario autenticado:', user.id);

      // Get bot config with template
      const { data: botConfig, error: configError } = await supabase
        .from('bot_configs')
        .select('selected_template_id')
        .eq('user_id', user.id)
        .single();

      console.log('📋 Bot Config:', botConfig);
      console.log('❓ Config Error:', configError);

      if (!botConfig?.selected_template_id) {
        console.log('⚠️ No hay plantilla seleccionada');
        setLoading(false);
        return;
      }

      // Get template info
      const { data: template, error: templateError } = await supabase
        .from('business_templates')
        .select('id, name, slug, supports_orders')
        .eq('id', botConfig.selected_template_id)
        .single();

      console.log('📄 Template:', template);
      console.log('❓ Template Error:', templateError);
      console.log('🛒 Supports Orders:', template?.supports_orders);

      setSupportsOrders(template?.supports_orders || false);
    } catch (error) {
      console.error('❌ Error checking template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="border-b">
        <div className="flex h-16 items-center px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <MessageSquare className="h-6 w-6" />
            <span className="hidden sm:inline-block">WhatsApp Bot</span>
          </Link>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col gap-2 border-r bg-muted/40 p-4">
          <nav className="space-y-1">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/connection">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <Wifi className="h-4 w-4" />
                Conexión
              </Button>
            </Link>
            <Link href="/dashboard/unanswered">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Mensajes Sin Responder
              </Button>
            </Link>
            {supportsOrders && (
              <>
                <Link href="/dashboard/orders">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Pedidos
                  </Button>
                </Link>
                <Link href="/dashboard/order-config">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 pl-8"
                  >
                    <Package className="h-4 w-4" />
                    Config. Pedidos
                  </Button>
                </Link>
              </>
            )}

            {/* Separator */}
            <div className="my-2 border-t"></div>

            <Link href="/dashboard/config">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <Sliders className="h-4 w-4" />
                Configuraciones
              </Button>
            </Link>
            <Link href="/dashboard/workflows">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <Workflow className="h-4 w-4" />
                Flujos de Trabajo
              </Button>
            </Link>
          </nav>

          {/* Info Card */}
          <div className="mt-auto p-4 border rounded-lg bg-background">
            <div className="text-sm font-medium mb-2">Estado del Proyecto</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>✅ Fase 1: Setup completado</div>
              <div>🚧 Fase 2: En desarrollo</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
