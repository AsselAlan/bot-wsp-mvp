import { NextRequest, NextResponse } from 'next/server';
import { isClientReady, getConnectedNumber, getWhatsAppClient } from '@/lib/whatsapp/client';
import { getUserId } from '@/lib/supabase/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Obtener userId del usuario autenticado
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar si el cliente existe
    const client = getWhatsAppClient(userId);

    if (!client) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'No hay cliente de WhatsApp inicializado'
      });
    }

    // Verificar si está conectado
    const isReady = await isClientReady(userId);

    if (!isReady) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: 'Cliente inicializado pero no conectado'
      });
    }

    // Obtener información del número conectado
    const phoneNumber = await getConnectedNumber(userId);

    return NextResponse.json({
      success: true,
      connected: true,
      phoneNumber,
      message: 'WhatsApp conectado correctamente'
    });

  } catch (error) {
    console.error('Error al verificar estado:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al verificar estado de WhatsApp',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Obtener userId del usuario autenticado
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { disconnectWhatsAppClient } = await import('@/lib/whatsapp/client');
    const success = await disconnectWhatsAppClient(userId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp desconectado correctamente'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No se encontró cliente para desconectar'
      });
    }

  } catch (error) {
    console.error('Error al desconectar:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al desconectar WhatsApp',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
