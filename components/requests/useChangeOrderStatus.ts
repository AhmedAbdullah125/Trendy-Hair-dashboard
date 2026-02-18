import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

export type OrderStatusType = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'completed';

interface ChangeOrderStatusParams {
    orderId: number;
    status: OrderStatusType;
}

interface ChangeOrderStatusResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

/**
 * Hook to change order status
 * @returns Mutation for changing order status
 */
export const useChangeOrderStatus = () => {
    const queryClient = useQueryClient();

    return useMutation<ChangeOrderStatusResponse, Error, ChangeOrderStatusParams>({
        mutationFn: async ({ orderId, status }: ChangeOrderStatusParams) => {
            const adminToken = localStorage.getItem('admin_token');

            // Create FormData
            const formData = new FormData();
            formData.append('status', status);

            const response = await axios.post<ChangeOrderStatusResponse>(
                `${API_BASE_URL}/v1/admin/orders/change-status/${orderId}`,
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
            // Invalidate and refetch orders
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        },
    });
};
