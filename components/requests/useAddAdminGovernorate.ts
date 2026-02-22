import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';
import { toast } from 'sonner';

interface AddGovernorateData {
    name_ar: string;
    name_en?: string;
    is_active?: number;
}

export const useAddAdminGovernorate = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: AddGovernorateData) => {
            const adminToken = localStorage.getItem('admin_token');

            const formData = new FormData();
            formData.append('translations[0][language]', "ar");
            formData.append('translations[0][name]', data.name_ar);
            if (data.name_en) {
                formData.append('translations[1][language]', "en");
                formData.append('translations[1][name]', data.name_en);
            }
            formData.append('is_active', (data.is_active ?? 1).toString());

            const response = await axios.post(
                `${API_BASE_URL}/v1/admin/governorate`,
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

            toast.success(data.message || 'تم إضافة المحافظة بنجاح', {
                style: {
                    background: '#1B8354',
                    color: '#fff',
                    borderRadius: '10px',
                    boxShadow: '5px 5px 10px rgba(0, 0, 0, 0.1)',
                },
            });
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message || 'حدث خطأ أثناء إضافة المحافظة';
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
