import { useState } from 'react';
import { useAdminUsers, useUpdateUserRole, useUpdateUserStatus } from '@/hooks/admin/useAdminUsers';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { data, isLoading } = useAdminUsers({
    role: roleFilter === 'all' ? undefined : roleFilter,
    isActive: statusFilter === 'all' ? undefined : parseInt(statusFilter),
  });

  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();

  const filteredUsers = data?.users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  }) || [];

  const stats = {
    total: data?.total || 0,
    active: data?.users.filter(u => u.isActive === 1).length || 0,
    admins: data?.users.filter(u => u.role === 'admin').length || 0,
  };

  const handleRoleChange = (userId: string, newRole: 'admin' | 'tecnico') => {
    updateRole.mutate({ userId, role: newRole });
  };

  const handleStatusToggle = (userId: string, currentStatus: number) => {
    updateStatus.mutate({ userId, isActive: currentStatus === 1 ? 0 : 1 });
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-users">Gestión de Usuarios</h1>
        <p className="text-muted-foreground mt-2">
          Administra usuarios, roles y permisos del sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatsCard
          title="Total Usuarios"
          value={stats.total}
          icon={Users}
          description="Usuarios registrados"
        />
        <AdminStatsCard
          title="Usuarios Activos"
          value={stats.active}
          icon={UserCheck}
          description="Usuarios con acceso"
        />
        <AdminStatsCard
          title="Administradores"
          value={stats.admins}
          icon={Shield}
          description="Cuentas con permisos admin"
        />
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:w-80"
            data-testid="input-search"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="md:w-40" data-testid="select-role-filter">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="tecnico">Técnico</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-40" data-testid="select-status-filter">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="1">Activos</SelectItem>
              <SelectItem value="0">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Búsquedas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell className="font-medium" data-testid={`text-username-${user.id}`}>
                      {user.username}
                    </TableCell>
                    <TableCell data-testid={`text-email-${user.id}`}>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as 'admin' | 'tecnico')}
                        disabled={updateRole.isPending}
                      >
                        <SelectTrigger className="w-32" data-testid={`select-role-${user.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-plan-${user.id}`}>
                        {user.subscriptionPlan}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-searches-${user.id}`}>
                      {user.searchesUsed} / {user.searchesLimit === -1 ? '∞' : user.searchesLimit}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.isActive === 1 ? 'default' : 'secondary'}
                        data-testid={`badge-status-${user.id}`}
                      >
                        {user.isActive === 1 ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusToggle(user.id, user.isActive)}
                        disabled={updateStatus.isPending}
                        data-testid={`button-toggle-status-${user.id}`}
                      >
                        {user.isActive === 1 ? (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Activar
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
