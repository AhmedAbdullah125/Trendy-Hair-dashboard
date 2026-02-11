import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';
import { toast } from 'sonner';

interface CreateRoleData {
    name: string;
    permissions: string[];
}

export const useCreateAdminRole = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateRoleData) => {
            const adminToken = localStorage.getItem('admin_token');
            const formData = new FormData();
            formData.append('name', data.name);
            data.permissions.forEach((perm, index) => {
                formData.append(`permission[${index}]`, perm);
            });

            const response = await axios.post(
                `${API_BASE_URL}/v1/admin/roles`,
                formData,
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
            toast.success(data.message || 'تم إنشاء الدور بنجاح');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'فشل إنشاء الدور');
        }
    });
};
