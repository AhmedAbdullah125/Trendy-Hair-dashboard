import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';
import { toast } from 'sonner';

interface UpdateGovernorateData {
    id: number;
    name_ar: string;
    name_en?: string;
    is_active?: number;
}

export const useUpdateAdminGovernorate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: UpdateGovernorateData) => {
            const adminToken = localStorage.getItem('admin_token');

            const formData = new FormData();
            formData.append('translations[0][language]', "ar");
            formData.append('translations[0][name]', data.name_ar);
            if (data.name_en) {
                formData.append('translations[1][language]', "en");
                formData.append('translations[1][name]', data.name_en);
            }
            formData.append('is_active', (data.is_active ?? 1).toString());
            // Adding _method='PUT' since data is submitted as FormData and typical Laravel backends require this
            formData.append('_method', 'PUT');

            const response = await axios.post(
                `${API_BASE_URL}/v1/admin/governorate/${data.id}`,
                formData,
                {
                    headers: {
                        'lang': 'ar',
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-governorates'] });

            toast.success(data.message || 'تم تحديث المحافظة بنجاح', {
                style: {
                    background: '#1B8354',
                    color: '#fff',
                    borderRadius: '10px',
                    boxShadow: '5px 5px 10px rgba(0, 0, 0, 0.1)',
                },
            });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || 'حدث خطأ أثناء تحديث المحافظة';
            toast.error(errorMessage, {
                style: {
                    background: '#dc3545',
                    color: '#fff',
                    borderRadius: '10px',
                    boxShadow: '5px 5px 10px rgba(0, 0, 0, 0.1)',
                },
            });
        },
    });
};
