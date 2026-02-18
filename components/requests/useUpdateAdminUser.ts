import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface UpdateAdminUserParams {
    id: number;
    name: string;
    email: string;
    phone: string;
    password?: string;
    is_active: number;
    photo?: File;
}

interface UpdateAdminUserResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

/**
 * Hook to update an existing admin user
 * @returns Mutation for updating admin user
 */
export const useUpdateAdminUser = () => {
    const queryClient = useQueryClient();

    return useMutation<UpdateAdminUserResponse, Error, UpdateAdminUserParams>({
        mutationFn: async (data: UpdateAdminUserParams) => {
            const adminToken = localStorage.getItem('admin_token');

            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('email', data.email);
            formData.append('phone', data.phone);
            formData.append('is_active', data.is_active.toString());

            if (data.password) {
                formData.append('password', data.password);
            }

            if (data.photo) {
                formData.append('photo', data.photo);
            }

            const response = await axios.put<UpdateAdminUserResponse>(
                `${API_BASE_URL}/v1/admin/users/${data.id}`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
    });
};
