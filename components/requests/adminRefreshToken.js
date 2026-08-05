import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';
import { toast } from 'sonner';
import { appendOAuthClient } from '@/lib/authConfig';

export async function adminRefreshToken(setLoading, lang) {
    setLoading(true);
    const url = `${API_BASE_URL}/v1/admin/auth/refresh-token`;
    const formData = new FormData();
    const refresh_token = localStorage.getItem("admin_refresh_token");

    formData.append('grant_type', "refresh_token");
    formData.append('refresh_token', refresh_token);
    appendOAuthClient(formData);
    const headers = { 'lang': lang };

    try {
        const response = await axios.post(url, formData, { headers });
        const message = response?.data?.message;

        setLoading(false);
        if (response.data.status) {
            const items = response?.data?.items ?? {};

            // This endpoint puts the token fields at the TOP LEVEL of `items`
            // ({token_type, expires_in, access_token, refresh_token}) — unlike
            // login, which nests them under `items.token` and also returns
            // `admin` and `permissions`.
            //
            // Reading `items.token` here gave `undefined`, so
            // `tokenData.access_token` threw a TypeError, the catch below
            // reported failure, and `useAdminTokenRefresh` signed the admin
            // out — on a refresh that had in fact succeeded. Accept either
            // shape so this survives the endpoint being aligned later.
            const tokenData = items.token ?? items;

            if (!tokenData?.access_token) {
                return { success: false, error: 'No access token in refresh response' };
            }

            localStorage.setItem("admin_token", tokenData.access_token);
            if (tokenData.refresh_token) {
                localStorage.setItem("admin_refresh_token", tokenData.refresh_token);
            }

            // Absent on this endpoint. Only overwrite when actually returned —
            // storing `undefined` wiped the identity and permission set that
            // login had correctly stored, which is what gates the sidebar.
            if (items.admin) {
                localStorage.setItem("admin_user", JSON.stringify(items.admin));
            }
            if (Array.isArray(items.permissions)) {
                localStorage.setItem("admin_permissions", JSON.stringify(items.permissions));
            }

            localStorage.setItem("admin_last_refresh_time", Date.now().toString());

            return { success: true }; // Indicate success
        } else {
            toast(message, {
                style: {
                    background: "#dc3545",
                    color: "#fff",
                    borderRadius: "10px",
                    boxShadow: "5px 5px 10px rgba(0, 0, 0, 0.1)",
                },
            });
            return { success: false };
        }
    } catch (error) {
        setLoading(false);
        const errorMessage = error?.response?.data?.message || error.message;
        toast(errorMessage, {
            style: {
                background: "#dc3545",
                color: "#fff",
                borderRadius: "10px",
                boxShadow: "5px 5px 10px rgba(0, 0, 0, 0.1)",
            },
        });
        return { success: false, error: errorMessage };
    }
}
