import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axiosInstance';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface AdminUser {
    id: number;
    name: string;
    photo: string;
    email: string;
    phone: string;
    is_active: number;
    is_verify: number;
    lang: string;
    wallet: string;
    created_at: string;
}

interface AdminUsersResponse {
    status: boolean;
    statusCode: number;
    message: string;
    items: {
        data: AdminUser[];
        pagination: {
            current_page: number;
            total_pages: number;
            total_items: number;
            page_size: number;
        };
    };
}

interface UseGetAdminUsersParams {
    pageSize?: number;
    pageNumber?: number;
    search?: string;
}

/**
 * Hook to fetch admin users with pagination
 * @param params - Pagination parameters
 * @returns React Query result with users data
 */
export const useGetAdminUsers = ({
    pageSize = 10,
    pageNumber = 1,
    search = '',
}: UseGetAdminUsersParams = {}) => {
    return useQuery<AdminUsersResponse>({
        queryKey: ['admin-users', pageSize, pageNumber, search],
        queryFn: async () => {
            const adminToken = localStorage.getItem('admin_token');

            const params: Record<string, string | number> = {
                page_size: pageSize,
                page_number: pageNumber,
            };

            if (search) {
                params.search = search;
            }

            const response = await api.get<AdminUsersResponse>(
                `${API_BASE_URL}/v1/admin/users`,
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
