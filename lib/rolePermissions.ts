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
  fetched: string[] | undefined
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
