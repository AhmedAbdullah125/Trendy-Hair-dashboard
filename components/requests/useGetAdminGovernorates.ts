import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axiosInstance';
import { API_BASE_URL } from '@/lib/apiConfig';

export const useGetAdminGovernorates = (pageSize = 1000, pageNumber = 1, lang = 'ar') => {
    return useQuery({
        queryKey: ['admin-governorates', pageSize, pageNumber, lang],
        queryFn: async () => {
            const adminToken = localStorage.getItem('admin_token');
            const response = await api.get(
                `${API_BASE_URL}/v1/admin/governorate`,
                {
                    params: {
                        page_size: pageSize,
                        page_number: pageNumber,
                    },
                    headers: {
                        'lang': lang,
                        'Authorization': `Bearer ${adminToken}`,
                    },
                }
            );
            return response.data;
        },
        enabled: !!localStorage.getItem('admin_token'),
    });
};
