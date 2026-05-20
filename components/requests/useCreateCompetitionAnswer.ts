import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface CreateCompetitionAnswerParams {
    competition_question_id: number;
    name: string;
    status: 'active' | 'inactive';
    sort_by: number;
    is_correct: 1 | 0;
}

interface CreateCompetitionAnswerResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

export const useCreateCompetitionAnswer = () => {
    const queryClient = useQueryClient();

    return useMutation<CreateCompetitionAnswerResponse, Error, CreateCompetitionAnswerParams>({
        mutationFn: async (data) => {
            const adminToken = localStorage.getItem('admin_token');
            const formData = new FormData();
            formData.append('competition_question_id', data.competition_question_id.toString());
            formData.append('name', data.name);
            formData.append('status', data.status);
            formData.append('sort_by', data.sort_by.toString());
            formData.append('is_correct', data.is_correct.toString());

            const response = await axios.post<CreateCompetitionAnswerResponse>(
                `${API_BASE_URL}/v1/admin/competition-answers`,
                formData,
                { headers: { 'Authorization': `Bearer ${adminToken}` } }
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['competition-answers'] });
        },
    });
};
