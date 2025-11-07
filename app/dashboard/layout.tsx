'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, LayoutDashboard, Wifi, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

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
            <Link href="/dashboard/config">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <Settings className="h-4 w-4" />
                Configuración
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
