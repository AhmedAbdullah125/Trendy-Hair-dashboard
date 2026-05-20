import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

export interface UpdateCompetitionQuestionParams {
    id: number;
    competition_stage_id: number;
    name: string;
    status: 'active' | 'inactive';
    sort_by: number;
}

interface UpdateCompetitionQuestionResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

export const useUpdateCompetitionQuestion = () => {
    const queryClient = useQueryClient();

    return useMutation<UpdateCompetitionQuestionResponse, Error, UpdateCompetitionQuestionParams>({
        mutationFn: async (data) => {
            const adminToken = localStorage.getItem('admin_token');
            const formData = new FormData();
            formData.append('competition_stage_id', data.competition_stage_id.toString());
            formData.append('name', data.name);
            formData.append('status', data.status);
            formData.append('sort_by', data.sort_by.toString());

            const response = await axios.post<UpdateCompetitionQuestionResponse>(
                `${API_BASE_URL}/v1/admin/competition-questions/${data.id}?_method=PUT`,
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
