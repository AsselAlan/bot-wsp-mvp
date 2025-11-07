import { NextRequest, NextResponse } from 'next/server';
import { getQRCode, isClientReady } from '@/lib/whatsapp/client';
import { getUserId } from '@/lib/supabase/auth';
import QRCode from 'qrcode';

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

    // Verificar si ya está conectado
    const isReady = await isClientReady(userId);

    if (isReady) {
      return NextResponse.json({
        success: true,
        connected: true,
        message: 'WhatsApp ya está conectado'
      });
    }

    // Obtener código QR
    const qrText = getQRCode(userId);

    if (!qrText) {
      return NextResponse.json({
        success: false,
        connected: false,
        message: 'QR Code no disponible. Inicia la conexión primero.'
      });
    }

    // Generar imagen QR en base64
    const qrImage = await QRCode.toDataURL(qrText, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    return NextResponse.json({
      success: true,
      connected: false,
      qrCode: qrImage,
      message: 'Escanea el código QR con WhatsApp'
    });

  } catch (error) {
    console.error('Error al obtener QR Code:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al generar QR Code',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
