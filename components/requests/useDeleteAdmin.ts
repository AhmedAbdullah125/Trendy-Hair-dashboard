import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';
import { toast } from 'sonner';

export const useDeleteAdmin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (adminId: number) => {
            const adminToken = localStorage.getItem('admin_token');
            const response = await axios.delete(
                `${API_BASE_URL}/v1/admin/admins/${adminId}`,
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
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            toast.success(data.message || 'تم حذف المشرف بنجاح');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'فشل حذف المشرف');
        }
    });
};
