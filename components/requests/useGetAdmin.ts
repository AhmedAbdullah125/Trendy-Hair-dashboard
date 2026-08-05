import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axiosInstance';
import { API_BASE_URL } from '@/lib/apiConfig';

export const useGetAdmin = (id: number | null) => {
    return useQuery({
        queryKey: ['admin', id],
        queryFn: async () => {
            if (!id) return null;
            const adminToken = localStorage.getItem('admin_token');
            const response = await api.get(
                `${API_BASE_URL}/v1/admin/admins/${id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'lang': 'ar'
                    }
                }
            );
            return response.data;
        },
        enabled: !!id, // Only run if ID is provided
    });
};
