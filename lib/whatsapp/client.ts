import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import { handleIncomingMessage } from './messageHandler';

// Store para mantener las instancias de clientes por usuario
const clients = new Map<string, Client>();

// Store para códigos QR temporales
const qrCodes = new Map<string, string>();

export interface WhatsAppClientConfig {
  userId: string;
  onQR?: (qr: string) => void;
  onReady?: () => void;
  onDisconnected?: () => void;
  onMessage?: (message: Message) => void;
}

/**
 * Crea o recupera un cliente de WhatsApp para un usuario
 */
export function getWhatsAppClient(userId: string): Client | null {
  return clients.get(userId) || null;
}

/**
 * Inicializa un nuevo cliente de WhatsApp
 */
export async function initializeWhatsAppClient(config: WhatsAppClientConfig): Promise<Client> {
  const { userId, onQR, onReady, onDisconnected, onMessage } = config;

  // Si ya existe un cliente para este usuario, lo retornamos
  let client = clients.get(userId);

  if (client) {
    return client;
  }

  // Crear nuevo cliente
  client = new Client({
    authStrategy: new LocalAuth({
      clientId: userId,
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    }
  });

  // Evento: QR Code generado
  client.on('qr', (qr) => {
    console.log(`QR Code generado para usuario ${userId}`);
    qrCodes.set(userId, qr);
    if (onQR) {
      onQR(qr);
    }
  });

  // Evento: Cliente listo
  client.on('ready', () => {
    console.log(`Cliente WhatsApp listo para usuario ${userId}`);
    qrCodes.delete(userId); // Limpiar QR ya que está conectado
    if (onReady) {
      onReady();
    }
  });

  // Evento: Cliente autenticado
  client.on('authenticated', () => {
    console.log(`Cliente autenticado para usuario ${userId}`);
  });

  // Evento: Fallo de autenticación
  client.on('auth_failure', (msg) => {
    console.error(`Fallo de autenticación para usuario ${userId}:`, msg);
    qrCodes.delete(userId);
  });

  // Evento: Desconectado
  client.on('disconnected', (reason) => {
    console.log(`Cliente desconectado para usuario ${userId}:`, reason);
    clients.delete(userId);
    qrCodes.delete(userId);
    if (onDisconnected) {
      onDisconnected();
    }
  });

  // Evento: Mensaje recibido
  client.on('message', async (message: Message) => {
    console.log(`Mensaje recibido de ${message.from} para usuario ${userId}`);

    // Manejar el mensaje
    try {
      await handleIncomingMessage(message, {
        userId,
        whatsappClient: client
      });

      // Callback opcional
      if (onMessage) {
        onMessage(message);
      }
    } catch (error) {
      console.error('Error al manejar mensaje:', error);
    }
  });

  // Guardar cliente en el store
  clients.set(userId, client);

  // Inicializar cliente
  await client.initialize();

  return client;
}

/**
 * Obtiene el código QR actual para un usuario
 */
export function getQRCode(userId: string): string | null {
  return qrCodes.get(userId) || null;
}

/**
 * Verifica si un cliente está conectado y listo
 */
export async function isClientReady(userId: string): Promise<boolean> {
  const client = clients.get(userId);
  if (!client) {
    return false;
  }

  try {
    const state = await client.getState();
    return state === 'CONNECTED';
  } catch (error) {
    console.error('Error verificando estado del cliente:', error);
    return false;
  }
}

/**
 * Obtiene información del número conectado
 */
export async function getConnectedNumber(userId: string): Promise<string | null> {
  const client = clients.get(userId);
  if (!client) {
    return null;
  }

  try {
    const info = await client.info;
    return info?.wid?.user || null;
  } catch (error) {
    console.error('Error obteniendo información del cliente:', error);
    return null;
  }
}

/**
 * Desconecta y destruye un cliente de WhatsApp
 */
export async function disconnectWhatsAppClient(userId: string): Promise<boolean> {
  const client = clients.get(userId);

  if (!client) {
    return false;
  }

  try {
    await client.destroy();
    clients.delete(userId);
    qrCodes.delete(userId);
    console.log(`Cliente desconectado y eliminado para usuario ${userId}`);
    return true;
  } catch (error) {
    console.error('Error desconectando cliente:', error);
    return false;
  }
}

/**
 * Envía un mensaje de WhatsApp
 */
export async function sendWhatsAppMessage(
  userId: string,
  to: string,
  message: string
): Promise<boolean> {
  const client = clients.get(userId);

  if (!client) {
    console.error('Cliente no encontrado para el usuario:', userId);
    return false;
  }

  try {
    // Formatear número de teléfono
    const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
    await client.sendMessage(chatId, message);
    console.log(`Mensaje enviado a ${to} por usuario ${userId}`);
    return true;
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return false;
  }
}

/**
 * Limpia todos los clientes (útil para shutdown)
 */
export async function cleanupAllClients(): Promise<void> {
  console.log('Limpiando todos los clientes de WhatsApp...');

  for (const [userId, client] of clients.entries()) {
    try {
      await client.destroy();
      console.log(`Cliente ${userId} destruido`);
    } catch (error) {
      console.error(`Error destruyendo cliente ${userId}:`, error);
    }
  }

  clients.clear();
  qrCodes.clear();
}
