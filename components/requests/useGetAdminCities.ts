import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

export const useGetAdminCities = (pageSize = 1000, pageNumber = 1, lang = 'ar') => {
    return useQuery({
        queryKey: ['admin-cities', pageSize, pageNumber, lang],
        queryFn: async () => {
            const adminToken = localStorage.getItem('admin_token');
            const response = await axios.get(
                `${API_BASE_URL}/v1/admin/city`,
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
