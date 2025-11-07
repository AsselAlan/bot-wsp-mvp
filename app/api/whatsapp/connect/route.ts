import { NextRequest, NextResponse } from 'next/server';
import { initializeWhatsAppClient } from '@/lib/whatsapp/client';
import { getUserId } from '@/lib/supabase/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Obtener userId del usuario autenticado
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    console.log('Iniciando conexión de WhatsApp para usuario:', userId);

    // Inicializar cliente de WhatsApp
    await initializeWhatsAppClient({
      userId,
      onQR: (qr) => {
        console.log('QR Code generado');
      },
      onReady: () => {
        console.log('WhatsApp conectado y listo');
      },
      onDisconnected: () => {
        console.log('WhatsApp desconectado');
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Cliente de WhatsApp inicializado. Esperando escaneo de QR.',
      userId
    });

  } catch (error) {
    console.error('Error al conectar WhatsApp:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al inicializar cliente de WhatsApp',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
