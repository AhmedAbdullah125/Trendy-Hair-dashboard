import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axiosInstance';
import { API_BASE_URL } from '@/lib/apiConfig';

interface DeleteCompetitionStageResponse {
    status: boolean;
    statusCode: number;
    message: string;
}

export const useDeleteCompetitionStage = () => {
    const queryClient = useQueryClient();

    return useMutation<DeleteCompetitionStageResponse, Error, number>({
        mutationFn: async (stageId) => {
            const adminToken = localStorage.getItem('admin_token');
            const response = await api.delete<DeleteCompetitionStageResponse>(
                `${API_BASE_URL}/v1/admin/competition-stages/${stageId}`,
                { headers: { 'Authorization': `Bearer ${adminToken}` } }
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['competition-stages'] });
        },
    });
};
