/**
 * When to seed a role's saved permissions into the open edit form.
 *
 * The permissions are not on the roles list, so they arrive separately and
 * possibly after the modal is already open. That makes "have I filled this in
 * yet?" a real question, and the obvious answer — "is the form empty?" — is
 * wrong: an admin unticking every box is a legitimate edit, and an emptiness
 * test reads it as unseeded and puts everything straight back.
 *
 * So seeding is tracked per role id instead. Split out of the component so the
 * rule can be exercised directly.
 */

/**
 * @param seededRoleId Role already seeded into the current form, or null.
 * @param roleId       Role being edited, or undefined when adding a new one.
 * @param fetched      That role's saved permissions, or undefined if still loading.
 */
export const shouldSeedPermissions = (
  seededRoleId: number | null,
  roleId: number | undefined,
  fetched: readonly unknown[] | undefined
): boolean => {
  // Adding a new role — there is nothing saved to seed from.
  if (!roleId) return false;
  // Already seeded; anything on screen now is the admin's own editing.
  if (seededRoleId === roleId) return false;
  // Still loading. Seeding `[]` here would look identical to a role with no
  // permissions, and saving would then strip it.
  if (!fetched) return false;

  return true;
};

/**
 * Whether a role can be saved with the permissions currently ticked.
 *
 * `RoleRequest` became `permission => required|array|min:1` in August 2026, so
 * an empty selection is now a 422 rather than a role with nothing granted.
 * Checking here turns that into an inline message on the box the admin needs to
 * tick, instead of a round trip ending in a toast.
 */
export const canSaveRole = (name: string, permissionCount: number): boolean =>
  name.trim().length > 0 && permissionCount > 0;

/** Why the role cannot be saved, or null when it can. */
export const roleValidationError = (
  name: string,
  permissionCount: number
): string | null => {
  if (!name.trim()) return 'اسم الدور مطلوب.';
  if (permissionCount === 0) return 'يجب اختيار صلاحية واحدة على الأقل.';
  return null;
};
