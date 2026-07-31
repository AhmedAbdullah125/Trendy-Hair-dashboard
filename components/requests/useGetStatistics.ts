import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

interface Metric {
    value: number;
    previous?: number;
    /** null when there is no baseline to compare against. */
    trend_percent?: number | null;
    new_today?: number;
}

export interface Statistics {
    sales_today: Metric;
    orders_today: Metric;
    active_customers: Metric;
    rewards_granted_today: Metric;
    /** Distinct players who started an attempt today. */
    competition_plays_today: number;
    totals: {
        orders: number;
        customers: number;
        /** Credit still sitting in customer wallets. */
        wallet_outstanding: number;
        rewards_granted_all_time: number;
        wallet_spent_all_time: number;
    };
}

interface StatisticsResponse {
    status: boolean;
    statusCode: number;
    message: string | null;
    items: Statistics;
}

export const useGetStatistics = () => {
    return useQuery<StatisticsResponse>({
        queryKey: ['admin-statistics'],
        queryFn: async () => {
            const adminToken = localStorage.getItem('admin_token');
            const response = await axios.get<StatisticsResponse>(
                `${API_BASE_URL}/v1/admin/statistics`,
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );
            return response.data;
        },
        enabled: !!localStorage.getItem('admin_token'),
        // Figures are per-day; refetching every minute is plenty.
        staleTime: 1000 * 60,
    });
};
