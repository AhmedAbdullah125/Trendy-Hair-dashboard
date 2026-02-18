import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

interface DeleteAdminReviewResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

/**
 * Hook to delete an admin review
 * @returns Mutation for deleting admin review
 */
export const useDeleteAdminReview = () => {
    const queryClient = useQueryClient();

    return useMutation<DeleteAdminReviewResponse, Error, number>({
        mutationFn: async (reviewId: number) => {
            const adminToken = localStorage.getItem('admin_token');

            const response = await axios.delete<DeleteAdminReviewResponse>(
                `${API_BASE_URL}/v1/admin/review/${reviewId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                    },
                }
            );

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
        },
    });
};
