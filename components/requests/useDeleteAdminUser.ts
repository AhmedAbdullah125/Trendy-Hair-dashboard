import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

interface DeleteAdminUserResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

/**
 * Hook to delete an admin user
 * @returns Mutation for deleting admin user
 */
export const useDeleteAdminUser = () => {
    const queryClient = useQueryClient();

    return useMutation<DeleteAdminUserResponse, Error, number>({
        mutationFn: async (userId: number) => {
            const adminToken = localStorage.getItem('admin_token');

            const response = await axios.delete<DeleteAdminUserResponse>(
                `${API_BASE_URL}/v1/admin/users/${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                    },
                }
            );

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
    });
};
