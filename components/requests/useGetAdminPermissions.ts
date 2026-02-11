import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

export const useGetAdminPermissions = () => {
    return useQuery({
        queryKey: ['admin-permissions'],
        queryFn: async () => {
            const adminToken = localStorage.getItem('admin_token');
            const response = await axios.get(
                `${API_BASE_URL}/v1/admin/roles/permissions/all`,
                {
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
