import { Client } from 'whatsapp-web.js';
import { Order } from '@/types';
import { getWhatsAppClient } from './client';

/**
 * Mensajes predefinidos para notificaciones de pedidos
 */
const DEFAULT_NOTIFICATIONS = {
  confirmed: `✅ *Pedido Confirmado*

Tu pedido #{order_number} ha sido confirmado.

🍕 *Productos:*
{items}

📍 *Dirección:*
{address}

💰 *Total:* {total}

👨‍🍳 Estamos preparando tu pedido.
⏰ Tiempo estimado: {estimated_time}

¡Gracias por tu compra!`,

  preparing: `👨‍🍳 *Tu pedido está en preparación*

Pedido #{order_number}

Estamos preparando tu pedido con mucho cuidado.
⏰ Llegará en aproximadamente {estimated_time}`,

  in_delivery: `🛵 *Tu pedido va en camino*

Pedido #{order_number}

Tu pedido está en camino hacia tu dirección.
📍 {address}

⏰ Llegará en breve`,

  delivered: `✅ *¡Pedido Entregado!*

Pedido #{order_number}

Esperamos que disfrutes tu pedido.

¿Cómo fue tu experiencia? Tu opinión nos ayuda a mejorar. 💚`,

  cancelled: `❌ *Pedido Cancelado*

Pedido #{order_number}

Tu pedido ha sido cancelado.

Si tienes alguna duda, no dudes en contactarnos.`,
};

/**
 * Formatea los items del pedido para el mensaje
 */
function formatOrderItems(items: any[]): string {
  return items
    .map((item, index) => {
      const details = item.detalles ? ` (${item.detalles})` : '';
      const price = item.precio ? ` - $${item.precio * item.cantidad}` : '';
      return `${index + 1}. ${item.cantidad}x ${item.producto}${details}${price}`;
    })
    .join('\n');
}

/**
 * Formatea la dirección del pedido para el mensaje
 */
function formatAddress(address: any): string {
  if (!address) return 'No especificada';

  const parts = [];

  if (address.calle && address.numero) {
    parts.push(`${address.calle} ${address.numero}`);
  } else if (address.calle) {
    parts.push(address.calle);
  }

  if (address.piso_depto) {
    parts.push(`Piso/Depto: ${address.piso_depto}`);
  }

  if (address.barrio) {
    parts.push(address.barrio);
  }

  if (address.referencias) {
    parts.push(`Ref: ${address.referencias}`);
  }

  return parts.join(', ') || 'No especificada';
}

/**
 * Reemplaza las variables en la plantilla del mensaje
 */
function replaceVariables(
  template: string,
  order: Order,
  customMessages?: Record<string, string>
): string {
  const itemsText = formatOrderItems(order.items || []);
  const addressText = formatAddress(order.delivery_address);

  return template
    .replace(/{order_number}/g, order.order_number)
    .replace(/{items}/g, itemsText)
    .replace(/{address}/g, addressText)
    .replace(/{total}/g, order.total?.toString() || '0')
    .replace(/{estimated_time}/g, order.estimated_delivery_time || '30-45 minutos')
    .replace(/{customer_name}/g, order.customer_name || 'Cliente');
}

/**
 * Notifica al cliente sobre el cambio de estado del pedido
 */
export async function notifyOrderStatusChange(
  userId: string,
  order: Order,
  newStatus: string,
  customMessages?: Record<string, string>
): Promise<boolean> {
  try {
    // Obtener el cliente de WhatsApp
    const client = getWhatsAppClient(userId);

    if (!client) {
      console.error('Cliente de WhatsApp no encontrado para usuario:', userId);
      return false;
    }

    // Verificar que el cliente esté listo
    try {
      const state = await client.getState();
      if (state !== 'CONNECTED') {
        console.error('Cliente de WhatsApp no está conectado');
        return false;
      }
    } catch (error) {
      console.error('Error al verificar estado del cliente:', error);
      return false;
    }

    // Obtener la plantilla del mensaje según el estado
    let messageTemplate: string;

    switch (newStatus) {
      case 'confirmed':
        messageTemplate = customMessages?.order_confirmation_message || DEFAULT_NOTIFICATIONS.confirmed;
        break;
      case 'preparing':
        messageTemplate = customMessages?.preparing_message || DEFAULT_NOTIFICATIONS.preparing;
        break;
      case 'in_delivery':
        messageTemplate = customMessages?.in_delivery_message || DEFAULT_NOTIFICATIONS.in_delivery;
        break;
      case 'delivered':
        messageTemplate = customMessages?.delivered_message || DEFAULT_NOTIFICATIONS.delivered;
        break;
      case 'cancelled':
        messageTemplate = customMessages?.cancelled_message || DEFAULT_NOTIFICATIONS.cancelled;
        break;
      default:
        // No enviar notificación para estado 'pending' o desconocidos
        console.log(`No se envía notificación para estado: ${newStatus}`);
        return false;
    }

    // Reemplazar variables en el mensaje
    const message = replaceVariables(messageTemplate, order, customMessages);

    // Formatear el ID de WhatsApp del cliente
    const chatId = order.customer_whatsapp_id.includes('@c.us')
      ? order.customer_whatsapp_id
      : `${order.customer_whatsapp_id}@c.us`;

    // Enviar el mensaje
    await client.sendMessage(chatId, message);

    console.log(`Notificación enviada a ${order.customer_whatsapp_id} para pedido ${order.order_number} (estado: ${newStatus})`);

    return true;
  } catch (error) {
    console.error('Error al enviar notificación de pedido:', error);
    return false;
  }
}

/**
 * Envía un mensaje personalizado relacionado con un pedido
 */
export async function sendOrderMessage(
  userId: string,
  customerWhatsappId: string,
  message: string
): Promise<boolean> {
  try {
    const client = getWhatsAppClient(userId);

    if (!client) {
      console.error('Cliente de WhatsApp no encontrado');
      return false;
    }

    const chatId = customerWhatsappId.includes('@c.us')
      ? customerWhatsappId
      : `${customerWhatsappId}@c.us`;

    await client.sendMessage(chatId, message);

    console.log(`Mensaje personalizado enviado a ${customerWhatsappId}`);

    return true;
  } catch (error) {
    console.error('Error al enviar mensaje personalizado:', error);
    return false;
  }
}

/**
 * Notifica sobre información faltante en el pedido
 */
export async function notifyMissingOrderInfo(
  userId: string,
  customerWhatsappId: string,
  missingFields: string[],
  customMessage?: string
): Promise<boolean> {
  try {
    const client = getWhatsAppClient(userId);

    if (!client) {
      return false;
    }

    const defaultMessage = `⚠️ Para completar tu pedido necesitamos la siguiente información:\n\n${missingFields.map(field => `• ${field}`).join('\n')}\n\nPor favor envíanos estos datos.`;

    const message = customMessage?.replace('{missing_fields}', missingFields.join(', ')) || defaultMessage;

    const chatId = customerWhatsappId.includes('@c.us')
      ? customerWhatsappId
      : `${customerWhatsappId}@c.us`;

    await client.sendMessage(chatId, message);

    return true;
  } catch (error) {
    console.error('Error al enviar notificación de información faltante:', error);
    return false;
  }
}
