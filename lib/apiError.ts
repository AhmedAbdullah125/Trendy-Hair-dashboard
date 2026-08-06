import axios from 'axios';

/**
 * Turns a failed request into something worth showing an admin.
 *
 * Screens were catching errors and reporting a fixed string — "حدث خطأ أثناء حفظ
 * البيانات" — while the response body said exactly what was wrong. A duplicate
 * phone, an email already taken, a password too short and a server fault were
 * all indistinguishable, so the only way to find out was the browser console.
 *
 * Laravel answers a failed validation with 422, a `message`, and an `errors`
 * map of field → messages. The map is the useful part: `message` alone is often
 * just "The given data was invalid."
 */

interface LaravelErrorBody {
  message?: string;
  /** Field-keyed validation messages. */
  errors?: Record<string, string[] | string>;
}

/** Laravel's generic validation headline, which tells the reader nothing. */
const GENERIC_VALIDATION_MESSAGES = [
  'the given data was invalid.',
  'the given data was invalid',
];

/** Flattens `errors` into one readable line. */
const flattenFieldErrors = (errors: Record<string, string[] | string>): string[] =>
  Object.values(errors)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((message): message is string => typeof message === 'string' && message.trim() !== '');

/**
 * @param error    Whatever was thrown.
 * @param fallback Shown when the response carries nothing usable.
 * @returns A message safe to put in a toast.
 */
export const getApiErrorMessage = (
  error: unknown,
  fallback = 'حدث خطأ أثناء حفظ البيانات'
): string => {
  if (axios.isAxiosError<LaravelErrorBody>(error)) {
    const body = error.response?.data;

    // Field errors first — they name the field that actually failed.
    if (body?.errors) {
      const fieldMessages = flattenFieldErrors(body.errors);
      if (fieldMessages.length > 0) return fieldMessages.join('\n');
    }

    const message = body?.message?.trim();
    if (message && !GENERIC_VALIDATION_MESSAGES.includes(message.toLowerCase())) {
      return message;
    }

    // No body worth reading. The status at least separates "you sent something
    // wrong" from "the server broke", which changes what the admin should do.
    const status = error.response?.status;
    if (status === 401 || status === 403) return 'ليس لديك صلاحية لتنفيذ هذا الإجراء.';
    if (status === 404) return 'العنصر غير موجود.';
    if (status === 413) return 'حجم الملف كبير جداً.';
    if (status && status >= 500) return 'خطأ في الخادم. يرجى المحاولة لاحقاً.';
    if (error.code === 'ERR_NETWORK') return 'تعذّر الاتصال بالخادم. تحقق من الإنترنت.';

    // Deliberately does not fall through to `error.message` below. Axios sets
    // that to its own "Request failed with status code 422" — English internal
    // text with no bearing on what the admin did. `response_api(false, 422,
    // null, $ex)` sends a null message, so this path is reached in practice.
    return fallback;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
};
