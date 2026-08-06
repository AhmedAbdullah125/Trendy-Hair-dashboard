/**
 * Validation for the order cancellation reason.
 *
 * Mirrors `ChangeStatusOrderRequest`: required when the new status is
 * `cancelled`, 3–500 characters, and must contain at least one letter so a
 * reason cannot be "123" or "---". The reason is shown to the customer and is
 * the only record of why the order was stopped, which is why the server insists
 * on it rather than accepting a blank.
 *
 * Checked here so the admin is told before the request, on the field itself.
 */

const MIN_LENGTH = 3;
const MAX_LENGTH = 500;

/** Matches the server's `regex:/\p{L}/u` — any letter, Arabic or Latin. */
const CONTAINS_LETTER = /\p{L}/u;

/**
 * @param reason What the admin typed.
 * @returns A message to display, or null when the reason is acceptable.
 */
export const cancellationReasonError = (reason: string): string | null => {
  const trimmed = reason.trim();

  if (!trimmed) return 'يجب كتابة سبب إلغاء الطلب.';
  if (trimmed.length < MIN_LENGTH) return `سبب الإلغاء يجب أن يكون ${MIN_LENGTH} أحرف على الأقل.`;
  if (trimmed.length > MAX_LENGTH) return `سبب الإلغاء يجب ألا يتجاوز ${MAX_LENGTH} حرفاً.`;
  if (!CONTAINS_LETTER.test(trimmed)) return 'سبب الإلغاء يجب أن يحتوي على نص مكتوب، وليس أرقاماً أو رموزاً فقط.';

  return null;
};

/** True when the chosen status is the one that demands a reason. */
export const requiresCancellationReason = (status: string): boolean => status === 'cancelled';
