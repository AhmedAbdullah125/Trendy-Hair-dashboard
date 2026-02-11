import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

export const useGetAdmins = (pageSize = 10, page = 1) => {
    return useQuery({
        queryKey: ['admins', page, pageSize],
        queryFn: async () => {
            const adminToken = localStorage.getItem('admin_token');
            const response = await axios.get(
                `${API_BASE_URL}/v1/admin/admins`,
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
