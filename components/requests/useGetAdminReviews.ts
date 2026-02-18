import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface Review {
    id: number;
    title_ar: string;
    title_en: string;
    image: string | null;
    video: string;
}

interface ReviewsResponse {
    status: boolean;
    statusCode: number;
    message: string;
    items: {
        products: Review[];
        pagination: {
            current_page: number;
            total_pages: number;
            total_items: number;
            page_size: number;
        };
    };
}

interface UseGetAdminReviewsParams {
    pageSize?: number;
    pageNumber?: number;
}

/**
 * Hook to fetch admin reviews with pagination
 * @param params - Pagination parameters
 * @returns React Query result with reviews data
 */
export const useGetAdminReviews = ({
    pageSize = 10,
    pageNumber = 1,
}: UseGetAdminReviewsParams = {}) => {
    return useQuery<ReviewsResponse>({
        queryKey: ['admin-reviews', pageSize, pageNumber],
        queryFn: async () => {
            const adminToken = localStorage.getItem('admin_token');

            const params = {
                page_size: pageSize,
                page_number: pageNumber,
            };

            const response = await axios.get<ReviewsResponse>(
                `${API_BASE_URL}/v1/admin/review`,
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
