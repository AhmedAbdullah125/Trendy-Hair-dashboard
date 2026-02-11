import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';
import { toast } from 'sonner';

interface UpdateAdminData {
    id: number;
    name: string;
    phone: string;
    email: string;
    password?: string;
    role: string;
}

export const useUpdateAdmin = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateAdminData) => {
            const adminToken = localStorage.getItem('admin_token');
            const formData = new FormData();
            formData.append('_method', 'PUT'); // Handling PUT via POST for FormData support
            formData.append('name', data.name);
            formData.append('phone', data.phone);
            formData.append('email', data.email);
            if (data.password) formData.append('password', data.password);
            formData.append('role', data.role);

            const response = await axios.post(
                `${API_BASE_URL}/v1/admin/admins/${data.id}`,
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
            toast.success(data.message || 'تم تحديث بيانات المشرف بنجاح');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'فشل تحديث بيانات المشرف');
        }
    });
};
