import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/apiConfig';

interface DeleteCompetitionQuestionResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

export const useDeleteCompetitionQuestion = () => {
    const queryClient = useQueryClient();

    return useMutation<DeleteCompetitionQuestionResponse, Error, number>({
        mutationFn: async (questionId) => {
            const adminToken = localStorage.getItem('admin_token');
            const response = await axios.delete<DeleteCompetitionQuestionResponse>(
                `${API_BASE_URL}/v1/admin/competition-questions/${questionId}`,
                { headers: { 'Authorization': `Bearer ${adminToken}` } }
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['competition-questions'] });
        },
    });
};
