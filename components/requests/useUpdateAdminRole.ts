import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';
import { toast } from 'sonner';

interface UpdateRoleData {
    id: number;
    name: string;
    permissions: string[];
}

export const useUpdateAdminRole = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateRoleData) => {
            const adminToken = localStorage.getItem('admin_token');
            // Using POST with _method=PUT or straight PUT depending on backend.
            // Requirement says "uput {{URL}}/admin/roles/11 with form data". 
            // Often Laravel/PHP backends need POST with _method for FormData.
            // But let's try direct PUT first if it accepts JSON, or FormData if needed.
            // The prompt said "with form data". Axios PUT with FormData is tricky on standard web forms but works.
            // However, PHP specifically has trouble parsing multipart/form-data on PUT requests.
            // Safe bet: POST with _method=PUT.

            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('name', data.name);
            data.permissions.forEach((perm, index) => {
                formData.append(`permission[${index}]`, perm);
            });

            const response = await axios.post(
                `${API_BASE_URL}/v1/admin/roles/${data.id}`,
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
            toast.success(data.message || 'تم تحديث الدور بنجاح');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'فشل تحديث الدور');
        }
    });
};
