// lib/swr-mutations.js
import { mutate } from 'swr'

// ✅ Обновить все кэши связанные с заказами
export function invalidateOrders(userId) {
  mutate('orders')  // Главная страница
  mutate(['my-orders', userId])  // Профиль продавца
  mutate(['my-bids', userId])  // Профиль креатора
}

// ✅ Обновить конкретный заказ
export function invalidateOrder(orderId) {
  mutate(['order', orderId])
}

// ✅ Обновить отклики заказа
export function invalidateBids(orderId) {
  mutate(['bids', orderId])
}