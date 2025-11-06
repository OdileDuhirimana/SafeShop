import Notification from '../models/Notification.js';
import OrderEvent from '../models/OrderEvent.js';

export async function createNotification({ userId, type, title, message, data = {} }) {
  if (!userId) return null;
  return Notification.create({ userId, type, title, message, data });
}

export async function addOrderEvent({ orderId, byUserId = null, type, note = '', meta = {} }) {
  if (!orderId || !type) return null;
  return OrderEvent.create({ orderId, byUserId, type, note, meta });
}
