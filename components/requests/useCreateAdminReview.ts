import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface CreateAdminReviewParams {
    title_ar: string;
    title_en: string;
    video?: File;
    image?: File;
}

interface CreateAdminReviewResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

/**
 * Hook to create a new admin review
 * @returns Mutation for creating admin review
 */
export const useCreateAdminReview = () => {
    const queryClient = useQueryClient();

    return useMutation<CreateAdminReviewResponse, Error, CreateAdminReviewParams>({
        mutationFn: async (data: CreateAdminReviewParams) => {
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

            const response = await axios.post<CreateAdminReviewResponse>(
                `${API_BASE_URL}/v1/admin/review`,
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
