import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Zap, Shield, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">WhatsApp Bot</span>
          </div>
          <nav className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Tu Asistente Virtual de WhatsApp
          <br />
          <span className="text-primary">Potenciado por IA</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Automatiza tus respuestas de WhatsApp con inteligencia artificial.
          Configura tu bot en minutos y mejora la atención a tus clientes 24/7.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="text-lg">
              Comenzar Gratis
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="text-lg">
              Ver Características
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Características Principales
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Conexión WhatsApp</CardTitle>
              <CardDescription>
                Conecta tu WhatsApp escaneando un código QR en segundos
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Respuestas IA</CardTitle>
              <CardDescription>
                Respuestas inteligentes powered by OpenAI GPT-4
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Seguro y Privado</CardTitle>
              <CardDescription>
                Tus datos protegidos con Row Level Security en Supabase
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Métricas en Tiempo Real</CardTitle>
              <CardDescription>
                Monitorea conversaciones, respuestas y rendimiento del bot
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Cómo Funciona
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Conecta WhatsApp</h3>
            <p className="text-muted-foreground">
              Escanea el código QR con tu teléfono y vincula tu cuenta
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Configura tu Bot</h3>
            <p className="text-muted-foreground">
              Define el contexto, información de negocio y respuestas automáticas
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">¡Listo!</h3>
            <p className="text-muted-foreground">
              Tu bot responderá automáticamente a tus clientes 24/7
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-4">
              ¿Listo para automatizar tu WhatsApp?
            </CardTitle>
            <CardDescription className="text-primary-foreground/80 text-lg mb-6">
              Únete a cientos de negocios que ya están usando nuestro bot de WhatsApp
            </CardDescription>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" variant="secondary">
                  Comenzar Ahora
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 WhatsApp Bot. Todos los derechos reservados.</p>
          <p className="mt-2 text-sm">
            Powered by Next.js, Supabase & OpenAI
          </p>
        </div>
      </footer>
    </div>
  );
}
