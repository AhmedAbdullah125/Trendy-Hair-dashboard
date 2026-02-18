import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface UpdateAdminReviewParams {
    id: number;
    title_ar: string;
    title_en: string;
    video?: File;
    image?: File;
}

interface UpdateAdminReviewResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

/**
 * Hook to update an existing admin review
 * @returns Mutation for updating admin review
 */
export const useUpdateAdminReview = () => {
    const queryClient = useQueryClient();

    return useMutation<UpdateAdminReviewResponse, Error, UpdateAdminReviewParams>({
        mutationFn: async (data: UpdateAdminReviewParams) => {
            const adminToken = localStorage.getItem('admin_token');

            const formData = new FormData();

            // Add translations in the required format
            formData.append('translations[0][language]', 'ar');
            formData.append('translations[0][title]', data.title_ar);
            formData.append('translations[1][language]', 'en');
            formData.append('translations[1][title]', data.title_en);

            if (data.video) {
                formData.append('video', data.video);
            }

            if (data.image) {
                formData.append('image', data.image);
            }

            const response = await axios.put<UpdateAdminReviewResponse>(
                `${API_BASE_URL}/v1/admin/review/${data.id}`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'multipart/form-data',
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
