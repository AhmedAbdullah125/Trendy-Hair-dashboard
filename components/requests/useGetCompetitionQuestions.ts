import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axiosInstance';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface CompetitionQuestion {
    id: number;
    competition_stage_id: number;
    stage: { id: number; name: string };
    name: string;
    status: 'active' | 'inactive';
    sort_by: number;
    answers_count: number;
    created_at: string;
    updated_at: string;
}

interface CompetitionQuestionsResponse {
    status: boolean;
    statusCode: number;
    message: string;
    items: {
        data: CompetitionQuestion[];
        pagination: {
            current_page: number;
            total_pages: number;
            total_items: number;
            page_size: number;
        };
    };
}

interface UseGetCompetitionQuestionsParams {
    stageId: number | null;
    pageSize?: number;
    pageNumber?: number;
}

export const useGetCompetitionQuestions = ({
    stageId,
    pageSize = 10,
    pageNumber = 1,
}: UseGetCompetitionQuestionsParams) => {
    return useQuery<CompetitionQuestionsResponse>({
        queryKey: ['competition-questions', stageId, pageSize, pageNumber],
        queryFn: async () => {
            const adminToken = localStorage.getItem('admin_token');
            const response = await api.get<CompetitionQuestionsResponse>(
                `${API_BASE_URL}/v1/admin/competition-questions`,
                {
                    params: {
                        competition_stage_id: stageId,
                        page_size: pageSize,
                        page_number: pageNumber,
                    },
                    headers: { 'Authorization': `Bearer ${adminToken}` },
                }
            );
            return response.data;
        },
        enabled: !!localStorage.getItem('admin_token') && stageId !== null,
    });
};
