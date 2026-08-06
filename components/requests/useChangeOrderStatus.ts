import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axiosInstance';
import { API_BASE_URL } from '@/lib/apiConfig';

import type { OrderStatusKey } from '@/lib/orderStatus';

/**
 * Kept as an alias for the canonical key type in `lib/orderStatus`.
 *
 * The local union used to omit `refunded`, which the backend's
 * `ChangeStatusOrderRequest` accepts — so a refund could never be recorded
 * from the dashboard.
 */
export type OrderStatusType = OrderStatusKey;

interface ChangeOrderStatusParams {
    orderId: number;
    status: OrderStatusKey;
    /**
     * Required by the API when `status` is `cancelled`, ignored otherwise.
     *
     * It is shown to the customer and is the only record of what went wrong, so
     * the server rejects a cancellation without one. Any other status clears
     * whatever was stored, so a reinstated order keeps no stale reason.
     */
    cancellationReason?: string;
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
        mutationFn: async ({ orderId, status, cancellationReason }: ChangeOrderStatusParams) => {
            const adminToken = localStorage.getItem('admin_token');

            // Create FormData
            const formData = new FormData();
            formData.append('status', status);

            // Sent only when there is one: the field is `nullable` for other
            // statuses, and posting an empty string would fail `min:3`.
            if (cancellationReason?.trim()) {
                formData.append('cancellation_reason', cancellationReason.trim());
            }

            const response = await api.post<ChangeOrderStatusResponse>(
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

            // Moving a cash order to "delivered" also marks it paid and debits
            // the customer's wallet server-side, so anything showing a balance
            // or the wallet ledger is now stale.
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
        },
    });
};
