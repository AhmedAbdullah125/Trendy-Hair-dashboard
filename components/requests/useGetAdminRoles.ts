import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axiosInstance';
import { API_BASE_URL } from '@/lib/apiConfig';

export const useGetAdminRoles = (pageSize = 10, page = 1) => {
    return useQuery({
        queryKey: ['admin-roles', page, pageSize],
        queryFn: async () => {
            const adminToken = localStorage.getItem('admin_token');
            const response = await api.get(
                `${API_BASE_URL}/v1/admin/roles`,
                {
                    params: {
                        page_size: pageSize,
                        page: page,
                    },
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'lang': 'ar'
                    }
                }
            );
            return response.data;
        }
    });
};
