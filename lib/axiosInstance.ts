import axios, { type AxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import { toast } from 'sonner';

/**
 * The dashboard's shared HTTP client.
 *
 * Every request module used to import raw `axios` and attach the bearer token
 * by hand, so nothing reacted to an expired session: `ProtectedAdminRoute`
 * only checks that `admin_token` *exists*, never that it is still valid. An
 * admin whose token had expired sat on a fully-rendered but empty screen while
 * each query failed independently, and was never sent back to the login form.
 *
 * This instance owns three things the ad-hoc calls could not:
 *
 *   - the bearer token and `lang` header, attached once
 *   - a single 401 path that clears auth state and redirects exactly once
 *   - de-duplicated error toasts, so twelve queries failing together produce
 *     one message rather than twelve
 *
 * Statuses other than 401 are passed through untouched — 403, 422, 429 and 500
 * are still the caller's to interpret, since each screen surfaces field errors
 * and rate limits differently.
 */

/** Auth state, cleared together so a partial logout cannot happen. */
const ADMIN_STORAGE_KEYS = [
  'admin_token',
  'admin_refresh_token',
  'admin_user',
  'admin_permissions',
  'admin_last_refresh_time',
] as const;

export const clearAdminSession = (): void => {
  ADMIN_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

/**
 * Guards against a burst of 401s each triggering their own redirect.
 *
 * Reset on a fresh sign-in so a later expiry is still handled.
 */
let isHandlingUnauthorized = false;

export const resetUnauthorizedGuard = (): void => {
  isHandlingUnauthorized = false;
};

/**
 * Ends the session and returns to the login screen.
 *
 * Navigation goes through `location.hash`, not `location.href`: the app is
 * mounted on a `HashRouter` and ships no SPA rewrite config, so a hard
 * navigation to the path `/admin/login` is a 404 on a static host.
 */
export const handleAdminUnauthorized = (): void => {
  if (isHandlingUnauthorized) return;
  isHandlingUnauthorized = true;

  clearAdminSession();

  // Record where the admin was so the login screen can return them there.
  const current = window.location.hash.replace(/^#/, '');
  if (current && !current.startsWith('/admin/login')) {
    try {
      sessionStorage.setItem('admin_redirect_after_login', current);
    } catch {
      // Private-mode storage failure is not worth blocking the redirect over.
    }
  }

  toast.error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مجدداً.');
  window.location.hash = '/admin/login';
};

/** Where to send the admin after signing back in. */
export const takeAdminRedirect = (): string | null => {
  try {
    const target = sessionStorage.getItem('admin_redirect_after_login');
    if (target) sessionStorage.removeItem('admin_redirect_after_login');
    return target;
  } catch {
    return null;
  }
};

const api: AxiosInstance = axios.create();

// ── Request interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');

  // Login and refresh send their own credentials and must stay usable while
  // signed out, so never overwrite an Authorization header a caller set.
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!config.headers.lang) {
    config.headers.lang = 'ar';
  }

  return config;
});

// ── Response interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // This API answers some failures with HTTP 200 and `status: false` in the
    // body, so an auth failure can arrive without a 401 status line.
    const body = response?.data as { statusCode?: number } | undefined;
    if (body?.statusCode === 401) {
      handleAdminUnauthorized();
      return Promise.reject(new Error('Unauthorized'));
    }
    return response;
  },
  (error: AxiosError) => {
    if (error?.response?.status === 401) {
      handleAdminUnauthorized();
    }
    // Everything else propagates unchanged; callers already handle 403/422/429/500.
    return Promise.reject(error);
  }
);

export default api;
