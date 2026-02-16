import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

// Type definitions based on API response structure
interface Governorate {
    id: number;
    name: string;
    is_active: number;
}

interface City {
    id: number;
    name: string;
    governorate_id: number;
    delivery_cost: string;
    is_active: number;
}

interface User {
    id: number;
    name: string;
    photo: string;
    email: string;
    phone: string;
    is_active: number;
    is_verify: number;
    lang: string;
    wallet: string;
    created_at: string;
}

interface ProductBrand {
    id: number;
    name: string;
    image: string;
    position: number;
    is_active: number;
}

interface ProductCategory {
    id: number;
    name: string;
    image: string;
    position: number;
    is_active: number;
}

interface OrderProduct {
    id: number;
    name: string;
    sku: string | null;
    description: string;
    main_image: string;
    price: number;
    discounted_price: number;
    current_price: number;
    has_discount: boolean;
    quantity: number;
    in_stock: boolean;
    stock_status: string;
    images: string[];
    brand: ProductBrand;
    category: ProductCategory;
    is_favorite: boolean;
    is_active: boolean;
    is_recently: boolean;
}

interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    price: string;
    total: string;
    product: OrderProduct;
}

export interface Order {
    id: number;
    order_number: string;
    subtotal: string;
    discount: string;
    delivery_cost: string;
    use_wallet: number;
    wallet_amount: string;
    payment_type: string;
    payment_status: string;
    status: string;
    notes: string | null;
    total: string;
    items_count: number;
    created_at: string;
    governorate: Governorate;
    city: City;
    user: User;
    items: OrderItem[];
}

interface AdminOrdersResponse {
    status: boolean;
    statusCode: number;
    message: string;
    items: {
        data: Order[];
        pagination: {
            current_page: number;
            total_pages: number;
            total_items: number;
            page_size: number;
        };
    };
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | '';

interface UseGetAdminOrdersParams {
    pageSize?: number;
    pageNumber?: number;
    status?: OrderStatus;
    from?: string;
    to?: string;
    search?: string;
    lang?: string;
}

/**
 * Hook to fetch admin orders with filtering, search, and pagination
 * @param params - Filter and pagination parameters
 * @returns React Query result with orders data
 */
export const useGetAdminOrders = ({
    pageSize = 10,
    pageNumber = 1,
    status = '',
    from = '',
    to = '',
    search = '',
    lang = 'ar'
}: UseGetAdminOrdersParams = {}) => {
    return useQuery<AdminOrdersResponse>({
        queryKey: ['admin-orders', pageSize, pageNumber, status, from, to, search, lang],
        queryFn: async () => {
            const adminToken = localStorage.getItem('admin_token');

            // Build params object, only including non-empty values
            const params: Record<string, string | number> = {
                page_size: pageSize,
                page_number: pageNumber,
            };

            if (status) params.status = status;
            if (from) params.from = from;
            if (to) params.to = to;
            if (search) params.search = search;

            const response = await axios.get<AdminOrdersResponse>(
                `${API_BASE_URL}/v1/admin/orders`,
                {
                    params,
                    headers: {
                        'lang': lang,
                        'Authorization': `Bearer ${adminToken}`,
                    },
                }
            );

            return response.data;
        },
        enabled: !!localStorage.getItem('admin_token'),
    });
};
