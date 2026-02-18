import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface CreateAdminBannerParams {
    title_ar: string;
    title_en: string;
    url: string;
    position: number;
    image: File;
}

interface CreateAdminBannerResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

/**
 * Hook to create a new admin banner
 * @returns Mutation for creating admin banner
 */
export const useCreateAdminBanner = () => {
    const queryClient = useQueryClient();

    return useMutation<CreateAdminBannerResponse, Error, CreateAdminBannerParams>({
        mutationFn: async (data: CreateAdminBannerParams) => {
            const adminToken = localStorage.getItem('admin_token');

            const formData = new FormData();

            // Add translations in the required format
            formData.append('translations[0][language]', 'ar');
            formData.append('translations[0][title]', data.title_ar);
            formData.append('translations[1][language]', 'en');
            formData.append('translations[1][title]', data.title_en);

            formData.append('url', data.url);
            formData.append('position', data.position.toString());
            formData.append('image', data.image);

            const response = await axios.post<CreateAdminBannerResponse>(
                `${API_BASE_URL}/v1/admin/banner`,
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
            queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
        },
    });
};
