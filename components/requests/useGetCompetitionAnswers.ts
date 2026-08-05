import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axiosInstance';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface CompetitionAnswer {
    id: number;
    competition_question_id: number;
    question: { id: number; name: string };
    name: string;
    status: 'active' | 'inactive';
    sort_by: number;
    is_correct: boolean;
    created_at: string;
    updated_at: string;
}

interface CompetitionAnswersResponse {
    status: boolean;
    statusCode: number;
    message: string;
    items: {
        data: CompetitionAnswer[];
        pagination: {
            current_page: number;
            total_pages: number;
            total_items: number;
            page_size: number;
        };
    };
}

interface UseGetCompetitionAnswersParams {
    questionId: number | null;
    pageSize?: number;
    pageNumber?: number;
}

export const useGetCompetitionAnswers = ({
    questionId,
    pageSize = 10,
    pageNumber = 1,
}: UseGetCompetitionAnswersParams) => {
    return useQuery<CompetitionAnswersResponse>({
        queryKey: ['competition-answers', questionId, pageSize, pageNumber],
        queryFn: async () => {
            const adminToken = localStorage.getItem('admin_token');
            const response = await api.get<CompetitionAnswersResponse>(
                `${API_BASE_URL}/v1/admin/competition-answers`,
                {
                    params: {
                        competition_question_id: questionId,
                        page_size: pageSize,
                        page_number: pageNumber,
                    },
                    headers: { 'Authorization': `Bearer ${adminToken}` },
                }
            );
            return response.data;
        },
        enabled: !!localStorage.getItem('admin_token') && questionId !== null,
    });
};
