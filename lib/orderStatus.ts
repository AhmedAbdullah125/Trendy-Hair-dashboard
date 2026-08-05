/**
 * Order and payment status, in one place.
 *
 * The API does not send the raw enum. `OrderDashResource` runs both `status`
 * and `payment_status` through a locale map before serialising, so what
 * arrives is a display string ("تم التسليم"), not a key ("delivered").
 *
 * Everything downstream nonetheless has to work in keys: `change-status`
 * validates `in:pending,confirmed,processing,shipped,delivered,cancelled,
 * refunded,completed` and rejects anything else. So the dashboard has to map
 * back — and the maps here are transcribed from
 * `app/Http/Resources/OrderDashResource.php` so the two cannot drift silently.
 *
 * This module previously lived inline in `AdminOrders`, where the Arabic for
 * `delivered` was written as "تم التوصيل" while the backend emits
 * "تم التسليم". The reverse lookup missed, the raw Arabic string was then
 * posted back as the new status, and the API rejected it — delivered orders
 * could not be advanced at all. `refunded` was missing outright.
 *
 * Logic keys off `OrderStatusKey`. Arabic is display only.
 */

/** Exactly the values `ChangeStatusOrderRequest` accepts. */
export const ORDER_STATUS_KEYS = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'completed',
] as const;

export type OrderStatusKey = (typeof ORDER_STATUS_KEYS)[number];

/** Transcribed from `OrderDashResource::translateOrderStatus()`. */
const ORDER_STATUS_LABELS: Record<OrderStatusKey, { ar: string; en: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  confirmed: { ar: 'مؤكد', en: 'Confirmed' },
  processing: { ar: 'قيد التجهيز', en: 'Processing' },
  shipped: { ar: 'تم الشحن', en: 'Shipped' },
  delivered: { ar: 'تم التسليم', en: 'Delivered' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
  refunded: { ar: 'مسترد', en: 'Refunded' },
  completed: { ar: 'مكتمل', en: 'Completed' },
};

/** Transcribed from `OrderDashResource::translatePaymentStatus()`. */
const PAYMENT_STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  paid: { ar: 'مدفوع', en: 'Paid' },
  failed: { ar: 'فشل الدفع', en: 'Failed' },
  refunded: { ar: 'مسترد', en: 'Refunded' },
};

const BADGE_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-cyan-100 text-cyan-600',
  processing: 'bg-blue-100 text-blue-600',
  shipped: 'bg-purple-100 text-purple-600',
  delivered: 'bg-emerald-100 text-emerald-600',
  completed: 'bg-green-100 text-green-600',
  cancelled: 'bg-red-100 text-red-600',
  refunded: 'bg-orange-100 text-orange-700',
  paid: 'bg-emerald-100 text-emerald-600',
  failed: 'bg-red-100 text-red-600',
  cash: 'bg-blue-100 text-blue-700',
};

/**
 * Reverse index: every label the backend can emit, in either locale, plus the
 * keys themselves. Built from the maps above so adding a status cannot leave a
 * half-updated lookup behind.
 */
const buildReverseIndex = (
  labels: Record<string, { ar: string; en: string }>
): Record<string, string> => {
  const index: Record<string, string> = {};
  for (const [key, label] of Object.entries(labels)) {
    index[key] = key;
    index[key.toLowerCase()] = key;
    index[label.ar] = key;
    index[label.en] = key;
    index[label.en.toLowerCase()] = key;
  }
  return index;
};

const ORDER_STATUS_INDEX = buildReverseIndex(ORDER_STATUS_LABELS);
const PAYMENT_STATUS_INDEX = buildReverseIndex(PAYMENT_STATUS_LABELS);

/**
 * Resolves whatever the API sent into a canonical key.
 *
 * Accepts a key, an Arabic label or an English label. Returns `null` when the
 * value is unrecognised — callers must not post an unknown value back, since
 * the API would reject it.
 */
export const toOrderStatusKey = (value: unknown): OrderStatusKey | null => {
  if (typeof value !== 'string') return null;
  const hit = ORDER_STATUS_INDEX[value.trim()];
  return (hit as OrderStatusKey) ?? null;
};

export const toPaymentStatusKey = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  return PAYMENT_STATUS_INDEX[value.trim()] ?? null;
};

/** Arabic label for display. Falls back to the raw value so nothing renders blank. */
export const orderStatusLabel = (value: unknown): string => {
  const key = toOrderStatusKey(value);
  if (key) return ORDER_STATUS_LABELS[key].ar;
  return typeof value === 'string' ? value : '';
};

/**
 * Badge label + colours for an order status, a payment status, or `cash`.
 *
 * One helper because the orders table renders all three through the same
 * component.
 */
export const statusBadge = (value: unknown): { label: string; colors: string } => {
  const raw = typeof value === 'string' ? value.trim() : '';

  const orderKey = toOrderStatusKey(raw);
  if (orderKey) {
    return { label: ORDER_STATUS_LABELS[orderKey].ar, colors: BADGE_COLORS[orderKey] };
  }

  const payKey = toPaymentStatusKey(raw);
  if (payKey) {
    return {
      label: PAYMENT_STATUS_LABELS[payKey].ar,
      colors: BADGE_COLORS[payKey] ?? 'bg-gray-100 text-gray-600',
    };
  }

  if (raw === 'cash' || raw === 'الدفع عند الاستلام') {
    return { label: 'الدفع عند الاستلام', colors: BADGE_COLORS.cash };
  }

  return { label: raw, colors: 'bg-gray-100 text-gray-600' };
};

/** Options for the status `<select>`, in workflow order. */
export const ORDER_STATUS_OPTIONS: { value: OrderStatusKey; label: string }[] =
  ORDER_STATUS_KEYS.map((key) => ({ value: key, label: ORDER_STATUS_LABELS[key].ar }));
