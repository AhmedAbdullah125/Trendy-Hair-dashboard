import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface CreateAdminUserParams {
    name: string;
    email: string;
    phone: string;
    password: string;
    is_active: number;
    photo?: File;
}

interface CreateAdminUserResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

/**
 * Hook to create a new admin user
 * @returns Mutation for creating admin user
 */
export const useCreateAdminUser = () => {
    const queryClient = useQueryClient();

    return useMutation<CreateAdminUserResponse, Error, CreateAdminUserParams>({
        mutationFn: async (data: CreateAdminUserParams) => {
            const adminToken = localStorage.getItem('admin_token');

            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('email', data.email);
            formData.append('phone', data.phone);
            formData.append('password', data.password);
            formData.append('is_active', data.is_active.toString());

            if (data.photo) {
                formData.append('photo', data.photo);
            }

            const response = await axios.post<CreateAdminUserResponse>(
                `${API_BASE_URL}/v1/admin/users`,
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
