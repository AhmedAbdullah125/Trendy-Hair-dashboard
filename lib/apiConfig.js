/**
 * API base URL.
 *
 * Was hardcoded to production, which meant local development ran against the
 * live API — changing real order statuses — with no way to point at staging.
 * It now comes from the environment, keeping the previous value as the
 * fallback so existing deployments are unaffected.
 *
 * No trailing slash: callers append `/v1/admin/...`, and `lib/imageUrl`
 * derives the storage origin from this.
 */
const API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL ?? 'https://trandyhairapp.com/api'
).replace(/\/+$/, '');

export { API_BASE_URL };
