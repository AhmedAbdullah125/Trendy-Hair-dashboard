import { useEffect, useState } from 'react';

/**
 * Admin permissions, read from the set the API returned at sign-in.
 *
 * `AdminEloquent::login()` sends
 * `$admin->getAllPermissions()->pluck('name')->toArray()` — a flat array of
 * Spatie permission names on the `admin` guard — and both `adminLoginRequest`
 * and `adminRefreshToken` persist it as `admin_permissions`. Until now nothing
 * ever read it back, so every admin saw every screen and every action.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Scope, deliberately narrow
 * ─────────────────────────────────────────────────────────────────────────
 * `PermissionSeeder` defines exactly six permissions:
 *
 *   access control panel · view dashboard
 *   view categories · create categories · edit categories · delete categories
 *
 * There is no `view orders`, `edit products`, `delete users` — those simply do
 * not exist server-side. So only the areas the backend can actually express
 * are gated here. Inventing names would be worse than not gating: the check
 * would fail for every admin (nobody holds a permission that does not exist)
 * and would hide working screens from the people who are allowed to use them.
 *
 * Extending coverage needs the backend to define the permissions first; see
 * BACKEND_INTEGRATION_REQUESTS.md.
 *
 * These checks are a UX affordance only. The API is the enforcement point and
 * already rejects unauthorised calls — nothing here is a security boundary.
 */

/** The permission names the backend actually defines. */
export const PERMISSIONS = {
  ACCESS_PANEL: 'access control panel',
  VIEW_DASHBOARD: 'view dashboard',
  VIEW_CATEGORIES: 'view categories',
  CREATE_CATEGORIES: 'create categories',
  EDIT_CATEGORIES: 'edit categories',
  DELETE_CATEGORIES: 'delete categories',
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const STORAGE_KEY = 'admin_permissions';

/** Permissions held by the signed-in admin. Empty when signed out or malformed. */
export const readPermissions = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : [];
  } catch {
    // Corrupt storage must not take the whole dashboard down.
    return [];
  }
};

/**
 * Whether the admin holds a permission.
 *
 * An **empty** permission set is treated as "allow". A super-admin is granted
 * every permission explicitly, so an empty array does not mean "restricted" —
 * it means the deployment has not been seeded, or an older build signed this
 * admin in before the set was persisted. Denying everything in that case would
 * lock legitimate admins out of a working dashboard, which is a worse failure
 * than showing a screen the API will refuse anyway.
 */
export const hasPermission = (permission: PermissionName | string): boolean => {
  const granted = readPermissions();
  if (granted.length === 0) return true;
  return granted.includes(permission);
};

/** Whether the admin holds at least one of these permissions. */
export const hasAnyPermission = (permissions: (PermissionName | string)[]): boolean => {
  if (permissions.length === 0) return true;
  const granted = readPermissions();
  if (granted.length === 0) return true;
  return permissions.some((p) => granted.includes(p));
};

/**
 * Permissions as React state.
 *
 * They are written to `localStorage` by the login and refresh flows rather
 * than held in React, so this re-reads on mount and listens for `storage`
 * events to stay correct when a token refresh updates them in another tab.
 */
export const useAdminPermissions = () => {
  const [permissions, setPermissions] = useState<string[]>(() => readPermissions());

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        setPermissions(readPermissions());
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const can = (permission: PermissionName | string): boolean => {
    if (permissions.length === 0) return true;
    return permissions.includes(permission);
  };

  const canAny = (list: (PermissionName | string)[]): boolean => {
    if (list.length === 0) return true;
    if (permissions.length === 0) return true;
    return list.some((p) => permissions.includes(p));
  };

  return { permissions, can, canAny };
};
