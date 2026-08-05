import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axiosInstance';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface UpdateCompetitionStageParams {
    id: number;
    name: string;
    status: 'active' | 'inactive';
    question_time: number;
    prize: number;
    sort_by: number;
    stage_number_of_questions: number;
}

interface UpdateCompetitionStageResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

export const useUpdateCompetitionStage = () => {
    const queryClient = useQueryClient();

    return useMutation<UpdateCompetitionStageResponse, Error, UpdateCompetitionStageParams>({
        mutationFn: async (data) => {
            const adminToken = localStorage.getItem('admin_token');
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('status', data.status);
            formData.append('question_time', data.question_time.toString());
            formData.append('prize', data.prize.toString());
            formData.append('sort_by', data.sort_by.toString());
            formData.append('stage_number_of_questions', data.stage_number_of_questions.toString());

            const response = await api.post<UpdateCompetitionStageResponse>(
                `${API_BASE_URL}/v1/admin/competition-stages/${data.id}?_method=PUT`,
                formData,
                { headers: { 'Authorization': `Bearer ${adminToken}` } }
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['competition-stages'] });
        },
    });
};
