import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axiosInstance';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface CreateCompetitionQuestionParams {
    competition_stage_id: number;
    name: string;
    status: 'active' | 'inactive';
    sort_by: number;
}

interface CreateCompetitionQuestionResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

export const useCreateCompetitionQuestion = () => {
    const queryClient = useQueryClient();

    return useMutation<CreateCompetitionQuestionResponse, Error, CreateCompetitionQuestionParams>({
        mutationFn: async (data) => {
            const adminToken = localStorage.getItem('admin_token');
            const formData = new FormData();
            formData.append('competition_stage_id', data.competition_stage_id.toString());
            formData.append('name', data.name);
            formData.append('status', data.status);
            formData.append('sort_by', data.sort_by.toString());

            const response = await api.post<CreateCompetitionQuestionResponse>(
                `${API_BASE_URL}/v1/admin/competition-questions`,
                formData,
                { headers: { 'Authorization': `Bearer ${adminToken}` } }
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['competition-questions'] });
        },
    });
};
