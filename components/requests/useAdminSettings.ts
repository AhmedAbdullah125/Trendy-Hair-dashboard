import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';
import { toast } from 'sonner';

/** Keys the backend accepts. Anything else is rejected server-side. */
export interface AdminSettings {
    email: string | null;
    phone: string | null;
    admin_whatsapp: string | null;
    tech_booking_url: string | null;
    terms_of_service: string | null;
    privacy_policy: string | null;
    competition_interval_minutes: string | null;
    competition_question_time: string | null;
    /** Lockout after losing a run. Default 1440 (24h). */
    competition_block_minutes: string | null;
    game_balance_cap: string | null;
    /** Points that make up one dinar — drives both earning and redemption. */
    points_per_dinar: string | null;
    /** Dinars a balance must reach before redemption is offered. 0 = no minimum. */
    min_wallet_redemption: string | null;
}

interface SettingsResponse {
    status: boolean;
    statusCode: number;
    message: string | null;
    items: { settings: AdminSettings };
}

const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
});

export const useGetAdminSettings = () =>
    useQuery<SettingsResponse>({
        queryKey: ['admin-settings'],
        queryFn: async () => {
            const response = await axios.get<SettingsResponse>(
                `${API_BASE_URL}/v1/admin/settings`,
                { headers: authHeaders() }
            );
            return response.data;
        },
        enabled: !!localStorage.getItem('admin_token'),
    });

/**
 * Persists settings to the backend.
 *
 * The content screen previously called a localStorage-backed context setter, so
 * an admin could press save and nothing ever reached a customer — the customer
 * app read its own separate localStorage.
 */
export const useUpdateAdminSettings = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (settings: Partial<AdminSettings>) => {
            const response = await axios.put<SettingsResponse>(
                `${API_BASE_URL}/v1/admin/settings`,
                { settings },
                { headers: authHeaders() }
            );

            // The API wraps failures in a 200 envelope, so status must be read
            // from the body rather than trusting the HTTP code.
            if (!response.data.status) {
                throw new Error(response.data.message || 'تعذّر حفظ الإعدادات');
            }

            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            toast.success('تم حفظ الإعدادات');
        },
        onError: (error: unknown) => {
            toast.error(error instanceof Error ? error.message : 'تعذّر حفظ الإعدادات');
        },
    });
};
