import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Diagram } from '@shared/schema';

interface HistoryEntry {
  id: string;
  userId: string;
  diagramId: string;
  viewedAt: string;
  diagram?: Diagram;
}

interface HistoryResponse {
  history: HistoryEntry[];
}

export function useUserHistory(limit: number = 3) {
  return useQuery<HistoryResponse>({
    queryKey: [`/api/user/history?limit=${limit}`],
  });
}

export function useRecordDiagramView() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (diagramId: string) => {
      return await apiRequest('POST', `/api/diagrams/${diagramId}/view`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/history'] });
    },
  });
}
