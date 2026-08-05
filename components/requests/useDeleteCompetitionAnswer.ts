import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axiosInstance';
import { API_BASE_URL } from '@/lib/apiConfig';

interface DeleteCompetitionAnswerResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

export const useDeleteCompetitionAnswer = () => {
    const queryClient = useQueryClient();

    return useMutation<DeleteCompetitionAnswerResponse, Error, number>({
        mutationFn: async (answerId) => {
            const adminToken = localStorage.getItem('admin_token');
            const response = await api.delete<DeleteCompetitionAnswerResponse>(
                `${API_BASE_URL}/v1/admin/competition-answers/${answerId}`,
                { headers: { 'Authorization': `Bearer ${adminToken}` } }
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['competition-answers'] });
        },
    });
};
