import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';
import { toast } from 'sonner';

export const useDeleteAdminRole = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (roleId: number) => {
            const adminToken = localStorage.getItem('admin_token');
            const response = await axios.delete(
                `${API_BASE_URL}/v1/admin/roles/${roleId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'lang': 'ar'
                    }
                }
            );
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
            toast.success(data.message || 'تم حذف الدور بنجاح');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'فشل حذف الدور');
        }
    });
};
