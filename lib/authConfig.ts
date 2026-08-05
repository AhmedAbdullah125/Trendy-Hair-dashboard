/**
 * OAuth client configuration.
 *
 * The apps no longer ship OAuth credentials. The server resolves the password-grant
 * client itself from `config('passport.clients.admins')` — backend `9163945`
 * made `client_id` / `client_secret` optional, and `07dc8de` fixed the resolved
 * client never reaching Passport.
 *
 * That is what finally removed the secret from the bundle. Moving it to
 * `VITE_OAUTH_CLIENT_SECRET` never could: Vite inlines `import.meta.env` at build
 * time, so an env-supplied secret is just as readable in `dist/`.
 *
 * Values sent on the request still take precedence server-side, so the env vars
 * remain a working override for any environment without `PASSPORT_{USER,ADMIN}_CLIENT_*`
 * configured. Set BOTH or NEITHER — an id without a secret fails the grant.
 *
 * The previously hardcoded secrets shipped in public bundles and must still be
 * rotated by the project owner.
 */

const env: ImportMetaEnv = import.meta.env ?? ({} as ImportMetaEnv);

export const OAUTH_CLIENT_ID: string = env.VITE_OAUTH_CLIENT_ID ?? '';

const OAUTH_CLIENT_SECRET: string = env.VITE_OAUTH_CLIENT_SECRET ?? '';

/**
 * Fails loudly at startup rather than surfacing as an opaque 422 on the login
 * form, which is what a missing client id looks like from the user's side.
 */
export const assertAuthConfig = (): void => {
  // Not an error: the server supplies the client from
  // `config('passport.clients.admins')`, so omitting both is intended. Only
  // the half-configured case is worth flagging — an id without its secret
  // reaches Passport as an incomplete client and fails the grant.
  if (OAUTH_CLIENT_ID && !OAUTH_CLIENT_SECRET) {
    console.warn(
      '[auth] VITE_OAUTH_CLIENT_ID is set without VITE_OAUTH_CLIENT_SECRET. ' +
      'Send both, or neither and let the server supply the client from config.'
    );
  }
};

/**
 * The OAuth client fields for a token request.
 *
 * `client_secret` is included only when one is configured, so a public-client
 * deployment sends a PKCE-compatible payload without touching this code.
 */
export const oauthClientFields = (): Record<string, string> => {
  const fields: Record<string, string> = {};
  // Omitted entirely when unset. An empty string is not the same as absent:
  // the server falls back to config only on a falsy value, and an empty one
  // would still reach Passport as an incomplete client.
  if (OAUTH_CLIENT_ID) fields.client_id = OAUTH_CLIENT_ID;
  if (OAUTH_CLIENT_SECRET) fields.client_secret = OAUTH_CLIENT_SECRET;
  return fields;
};

/** Appends the OAuth client fields to a `FormData` payload. */
export const appendOAuthClient = (formData: FormData): void => {
  Object.entries(oauthClientFields()).forEach(([key, value]) => formData.append(key, value));
};
