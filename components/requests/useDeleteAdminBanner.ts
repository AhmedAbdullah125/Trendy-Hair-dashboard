import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

interface DeleteAdminBannerResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

/**
 * Hook to delete an admin banner
 * @returns Mutation for deleting admin banner
 */
export const useDeleteAdminBanner = () => {
    const queryClient = useQueryClient();

    return useMutation<DeleteAdminBannerResponse, Error, number>({
        mutationFn: async (bannerId: number) => {
            const adminToken = localStorage.getItem('admin_token');

            const response = await axios.delete<DeleteAdminBannerResponse>(
                `${API_BASE_URL}/v1/admin/banner/${bannerId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                    },
                }
            );

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
        },
    });
};
