import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';
import { toast } from 'sonner';

interface CreateAdminData {
    name: string;
    phone: string;
    email: string;
    password?: string;
    role: string;
}

export const useCreateAdmin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateAdminData) => {
            const adminToken = localStorage.getItem('admin_token');
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('phone', data.phone);
            formData.append('email', data.email);
            if (data.password) formData.append('password', data.password);
            formData.append('role', data.role);

            const response = await axios.post(
                `${API_BASE_URL}/v1/admin/admins`,
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
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            toast.success(data.message || 'تم إنشاء المشرف بنجاح');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'فشل إنشاء المشرف');
        }
    });
};
