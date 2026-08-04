import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

interface MarkOrderPaidResponse {
    status: boolean;
    statusCode: number;
    message: string;
    /** `already_paid` when the order was settled before this call. */
    code?: string;
}

/**
 * Records payment on a cash order.
 *
 * Replaces the old workaround of posting `status: delivered`, which was the only
 * way to settle a cash order before this endpoint existed and forced the
 * delivery status to change as a side effect. This leaves delivery alone.
 *
 * - Cash orders only; anything else returns 422 `not_cash_order`
 * - Already-paid returns 200 with `code: "already_paid"`, so retrying is safe
 * - Debits the customer's points and credits the order's earned points, in one
 *   transaction, exactly as marking it delivered does
 */
export const useMarkOrderPaid = () => {
    const queryClient = useQueryClient();

    return useMutation<MarkOrderPaidResponse, Error, number>({
        mutationFn: async (orderId: number) => {
            const adminToken = localStorage.getItem('admin_token');

            const response = await axios.post<MarkOrderPaidResponse>(
                `${API_BASE_URL}/v1/admin/orders/mark-paid/${orderId}`,
                {},
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            // Settling an order moves the customer's points balance.
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
        },
    });
};
