import { useEffect, useRef } from 'react';
import { adminRefreshToken } from '../components/requests/adminRefreshToken';

/**
 * Hook to automatically refresh admin token before expiration
 * Refreshes token 5 minutes before the 1-year expiration
 */
export const useAdminTokenRefresh = () => {
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Check if we have a token
        const adminToken = localStorage.getItem('admin_token');
        if (!adminToken) {
            return;
        }

        // Define how often we want to refresh. 
        // Even if the token lasts 1 year, refreshing daily or weekly is good practice.
        // Let's set it to 24 hours for safety, or we can stick to 11 months if strict.
        // Given the user trying to fix it, I'll use a safer, shorter interval to keep it fresh.
        // But to respect the code's "11 months" comment, let's assume they want it long-lived.
        // However, checking every minute if 11 months passed is fine.

        // 11 months = 1000 * 60 * 60 * 24 * 30 * 11
        const REFRESH_THRESHOLD = 1000 * 60 * 60 * 24 * 30 * 11;

        // Check function
        const checkAndRefresh = async () => {
            const lastRefresh = localStorage.getItem('admin_last_refresh_time');
            const now = Date.now();

            // If no last refresh time, set it to now (assumes just logged in or legacy) 
            // OR force refresh? Let's force refresh if missing to be safe.
            if (!lastRefresh) {
                // No record? Refresh to be safe and set the time.
                await performRefresh();
                return;
            }

            const timeSinceLastRefresh = now - parseInt(lastRefresh, 10);

            if (timeSinceLastRefresh >= REFRESH_THRESHOLD) {
                await performRefresh();
            }
        };

        const performRefresh = async () => {
            try {
                const result = await adminRefreshToken(() => { }, 'ar');

                if (!result.success) {
                    handleRefreshFailure();
                }
            } catch (error) {
                console.error('Token refresh failed', error);
                handleRefreshFailure();
            }
        };

        const handleRefreshFailure = () => {
            console.error('Failed to refresh admin token - logging out');
            // Clear invalid tokens
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_refresh_token');
            localStorage.removeItem('admin_user');
            localStorage.removeItem('admin_permissions');
            localStorage.removeItem('admin_last_refresh_time');
            // Redirect to login
            window.location.href = '/admin/login';
        };

        // Check on mount
        checkAndRefresh();

        // Check every 5 minutes
        refreshIntervalRef.current = setInterval(checkAndRefresh, 5 * 60 * 1000);

        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []);
};
