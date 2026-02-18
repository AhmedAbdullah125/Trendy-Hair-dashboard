import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface Banner {
    id: number;
    title_en: string;
    title_ar: string;
    image: string;
    url: string;
    position: number;
    is_active: number;
}

interface BannersResponse {
    status: boolean;
    statusCode: number;
    message: string;
    items: {
        data: Banner[];
        pagination: {
            current_page: number;
            total_pages: number;
            total_items: number;
            page_size: number;
        };
    };
}

interface UseGetAdminBannersParams {
    pageSize?: number;
    pageNumber?: number;
}

/**
 * Hook to fetch admin banners with pagination
 * @param params - Pagination parameters
 * @returns React Query result with banners data
 */
export const useGetAdminBanners = ({
    pageSize = 10,
    pageNumber = 1,
}: UseGetAdminBannersParams = {}) => {
    return useQuery<BannersResponse>({
        queryKey: ['admin-banners', pageSize, pageNumber],
        queryFn: async () => {
            const adminToken = localStorage.getItem('admin_token');

            const params = {
                page_size: pageSize,
                page_number: pageNumber,
            };

            const response = await axios.get<BannersResponse>(
                `${API_BASE_URL}/v1/admin/banner`,
                {
                    params,
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                    },
                }
            );

            return response.data;
        },
        enabled: !!localStorage.getItem('admin_token'),
    });
};
