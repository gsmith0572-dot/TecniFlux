import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface AdminDiagram {
  id: string;
  fileName: string;
  fileId: string;
  fileUrl: string;
  directUrl: string;
  make: string;
  model: string;
  year: number;
  systemType: string;
  description?: string;
  tags?: string[];
  createdAt?: string;
}

export interface DiagramsResponse {
  diagrams: AdminDiagram[];
  total: number;
  limit: number;
  offset: number;
}

export function useAdminDiagrams(params?: { 
  limit?: number; 
  offset?: number; 
  make?: string;
  model?: string;
  year?: number;
  systemType?: string;
}) {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.make) queryParams.append('make', params.make);
  if (params?.model) queryParams.append('model', params.model);
  if (params?.year) queryParams.append('year', params.year.toString());
  if (params?.systemType) queryParams.append('systemType', params.systemType);

  return useQuery<DiagramsResponse>({
    queryKey: ['/api/admin/diagrams', params],
    queryFn: async () => {
      const res = await fetch(`/api/admin/diagrams?${queryParams}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch diagrams');
      return res.json();
    },
  });
}

export function useCreateDiagram() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/admin/diagrams', {
        method: 'POST',
        credentials: 'include',
        body: formData, // Don't set Content-Type - browser will set it with boundary
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create diagram');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/diagrams'] });
      toast({
        title: 'Diagrama creado',
        description: 'El diagrama ha sido subido exitosamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error al subir diagrama',
        description: error instanceof Error ? error.message : 'No se pudo crear el diagrama',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateDiagram() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AdminDiagram> }) => {
      const res = await apiRequest('PATCH', `/api/admin/diagrams/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/diagrams'] });
      toast({
        title: 'Diagrama actualizado',
        description: 'Los cambios han sido guardados exitosamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el diagrama',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteDiagram() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/diagrams/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete diagram');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/diagrams'] });
      toast({
        title: 'Diagrama eliminado',
        description: 'El diagrama ha sido eliminado exitosamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar el diagrama',
        variant: 'destructive',
      });
    },
  });
}
