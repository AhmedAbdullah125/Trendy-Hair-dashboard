import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axiosInstance';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface WalletTransaction {
    id: number;
    /** Raw key, e.g. "competition_prize_stage_3", "payment_order", "refund_order_12". */
    action: string;
    /** Signed: positive credited, negative spent. */
    amount: number;
    /** Balance immediately after this transaction. */
    balance: number;
    direction: 'credit' | 'debit';
    created_at: string;
    user?: {
        id: number;
        name: string | null;
        phone: string | null;
    };
}

interface WalletTransactionsResponse {
    status: boolean;
    statusCode: number;
    message: string | null;
    items: {
        transactions: WalletTransaction[];
        pagination: {
            current_page: number;
            total_pages: number;
            total_items: number;
            page_size: number;
        };
    };
}

interface Params {
    pageSize?: number;
    pageNumber?: number;
    search?: string;
    direction?: 'credit' | 'debit';
}

export const useGetWalletTransactions = ({
    pageSize = 15,
    pageNumber = 1,
    search,
    direction,
}: Params = {}) => {
    return useQuery<WalletTransactionsResponse>({
        queryKey: ['wallet-transactions', pageSize, pageNumber, search, direction],
        queryFn: async () => {
            const adminToken = localStorage.getItem('admin_token');
            const response = await api.get<WalletTransactionsResponse>(
                `${API_BASE_URL}/v1/admin/wallet-transactions`,
                {
                    params: {
                        page_size: pageSize,
                        page_number: pageNumber,
                        ...(search ? { search } : {}),
                        ...(direction ? { direction } : {}),
                    },
                    headers: { Authorization: `Bearer ${adminToken}` },
                }
            );
            return response.data;
        },
        enabled: !!localStorage.getItem('admin_token'),
    });
};
