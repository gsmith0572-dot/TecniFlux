import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'tecnico';
  isActive: number;
  subscriptionPlan: string;
  searchesUsed: number;
  searchesLimit: number;
  createdAt?: string;
  lastAccessAt?: string;
}

export interface UsersResponse {
  users: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}

export function useAdminUsers(params?: { limit?: number; offset?: number; role?: string; isActive?: number }) {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.role) queryParams.append('role', params.role);
  if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

  return useQuery<UsersResponse>({
    queryKey: ['/api/admin/users', params],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?${queryParams}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });
}

export function useUpdateUserRole() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'tecnico' }) => {
      const res = await apiRequest('POST', `/api/admin/users/${userId}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Rol actualizado',
        description: 'El rol del usuario ha sido cambiado exitosamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el rol',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateUserStatus() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: number }) => {
      const res = await apiRequest('PATCH', `/api/admin/users/${userId}/status`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Estado actualizado',
        description: 'El estado del usuario ha sido cambiado exitosamente',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    },
  });
}
