import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface CompetitionStage {
    id: number;
    name: string;
    status: 'active' | 'inactive';
    question_time: number;
    prize: string;
    sort_by: number;
    questions_count: number;
    stage_number_of_questions?: number;
    created_at: string;
    updated_at: string;
}

interface CompetitionStagesResponse {
    status: boolean;
    statusCode: number;
    message: string;
    items: {
        data: CompetitionStage[];
        pagination: {
            current_page: number;
            total_pages: number;
            total_items: number;
            page_size: number;
        };
    };
}

interface UseGetCompetitionStagesParams {
    pageSize?: number;
    pageNumber?: number;
}

export const useGetCompetitionStages = ({
    pageSize = 10,
    pageNumber = 1,
}: UseGetCompetitionStagesParams = {}) => {
    return useQuery<CompetitionStagesResponse>({
        queryKey: ['competition-stages', pageSize, pageNumber],
        queryFn: async () => {
            const adminToken = localStorage.getItem('admin_token');
            const response = await axios.get<CompetitionStagesResponse>(
                `${API_BASE_URL}/v1/admin/competition-stages`,
                {
                    params: { page_size: pageSize, page_number: pageNumber },
                    headers: { 'Authorization': `Bearer ${adminToken}` },
                }
            );
            return response.data;
        },
        enabled: !!localStorage.getItem('admin_token'),
    });
};
