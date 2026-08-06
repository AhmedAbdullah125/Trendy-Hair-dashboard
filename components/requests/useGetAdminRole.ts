import { useQueries, useQuery } from '@tanstack/react-query';
import api from '@/lib/axiosInstance';
import { API_BASE_URL } from '@/lib/apiConfig';

/**
 * A single role, with the permissions actually assigned to it.
 *
 * The roles *list* endpoint returns only id/name/timestamps — it carries no
 * permissions at all. That is why the edit form came up with nothing ticked and
 * the table could not say what any role could do: the data had never been
 * fetched. `show` is the only endpoint that has it, under `items.rolePermissions`
 * (permission **names**, which is also what create/update expect back).
 */

/** Shared so the table and the edit modal hit one cache entry, not two. */
export const adminRoleQueryOptions = (id: number | null | undefined) => ({
    queryKey: ['admin-role', id] as const,
    queryFn: async () => {
        const adminToken = localStorage.getItem('admin_token');
        const response = await api.get(
            `${API_BASE_URL}/v1/admin/roles/${id}`,
            {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'lang': 'ar',
                },
            }
        );
        return response.data;
    },
    enabled: !!id,
});

export const useGetAdminRole = (id: number | null | undefined) =>
    useQuery(adminRoleQueryOptions(id));

/**
 * The permissions of several roles at once, for the list view.
 *
 * One request per role because the list endpoint does not include them; they
 * share the cache with `useGetAdminRole`, so opening a role for editing after
 * the table has loaded costs nothing further.
 */
export const useGetAdminRolePermissions = (ids: number[]) => {
    const results = useQueries({
        queries: ids.map((id) => adminRoleQueryOptions(id)),
    });

    const permissionsByRole: Record<number, string[]> = {};
    ids.forEach((id, index) => {
        const names = results[index]?.data?.items?.rolePermissions;
        if (Array.isArray(names)) permissionsByRole[id] = names;
    });

    return {
        permissionsByRole,
        isLoading: results.some((result) => result.isLoading),
    };
};
