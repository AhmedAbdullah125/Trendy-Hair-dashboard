import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface UpdateAdminBannerParams {
    id: number;
    title_ar: string;
    title_en: string;
    url: string;
    position: number;
    image?: File;
}

interface UpdateAdminBannerResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

/**
 * Hook to update an existing admin banner
 * @returns Mutation for updating admin banner
 */
export const useUpdateAdminBanner = () => {
    const queryClient = useQueryClient();

    return useMutation<UpdateAdminBannerResponse, Error, UpdateAdminBannerParams>({
        mutationFn: async (data: UpdateAdminBannerParams) => {
            const adminToken = localStorage.getItem('admin_token');

            const formData = new FormData();

            // Add translations in the required format
            formData.append('translations[0][language]', 'ar');
            formData.append('translations[0][title]', data.title_ar);
            formData.append('translations[1][language]', 'en');
            formData.append('translations[1][title]', data.title_en);

            formData.append('url', data.url);
            formData.append('position', data.position.toString());

            if (data.image) {
                formData.append('image', data.image);
            }

            const response = await axios.put<UpdateAdminBannerResponse>(
                `${API_BASE_URL}/v1/admin/banner/${data.id}`,
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
