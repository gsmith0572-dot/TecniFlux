import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, DollarSign, TrendingUp, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDiagrams: number;
  monthlyRevenue: number;
}

interface DiagramStats {
  total: number;
  complete: number;
  partial: number;
  topMakes: Array<{ make: string; count: number }>;
}

export default function AdminDashboard() {
  const { data: users } = useQuery<any>({
    queryKey: ['/api/admin/users'],
  });

  const { data: diagramsData } = useQuery<any>({
    queryKey: ['/api/admin/diagrams'],
  });

  const { data: diagramStats, isLoading: isLoadingStats } = useQuery<DiagramStats>({
    queryKey: ['/api/admin/diagrams/stats'],
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: finance } = useQuery<any>({
    queryKey: ['/api/admin/finance/monthly'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/finance/monthly?year=${currentYear}&month=${currentMonth}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch finance data');
      return res.json();
    },
  });

  const stats: DashboardStats = {
    totalUsers: users?.total || 0,
    activeUsers: users?.users?.filter((u: any) => u.isActive === 1).length || 0,
    totalDiagrams: diagramsData?.total || 0,
    monthlyRevenue: finance?.grossRevenue || 0,
  };

  // Prepare chart data from top makes (take top 10 for better visualization)
  const chartData = diagramStats?.topMakes.slice(0, 10).map(item => ({
    name: item.make,
    count: item.count,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-admin-dashboard">Dashboard</h1>
        <p className="text-muted-foreground">Vista general del sistema TecniFlux</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-users">
              {stats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diagramas</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-diagrams">
              {isLoadingStats ? <Skeleton className="h-8 w-20" /> : diagramStats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              En catálogo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-complete-diagrams">
              {isLoadingStats ? <Skeleton className="h-8 w-20" /> : diagramStats?.complete || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {diagramStats?.total ? `${((diagramStats.complete / diagramStats.total) * 100).toFixed(1)}% del total` : '0% del total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parciales</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="stat-partial-diagrams">
              {isLoadingStats ? <Skeleton className="h-8 w-20" /> : diagramStats?.partial || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {diagramStats?.total ? `${((diagramStats.partial / diagramStats.total) * 100).toFixed(1)}% del total` : '0% del total'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Marcas</CardTitle>
            <p className="text-sm text-muted-foreground">Marcas con más diagramas</p>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Skeleton className="h-[300px] w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No hay datos disponibles
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución de Planes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Free</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '45%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Premium</span>
                  <span className="font-medium">30%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: '30%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Plus</span>
                  <span className="font-medium">20%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: '20%' }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Pro</span>
                  <span className="font-medium">5%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary/60" style={{ width: '5%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Finanzas del Mes</CardTitle>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Ingresos Brutos</p>
              <p className="text-2xl font-bold" data-testid="stat-gross-revenue">
                ${stats.monthlyRevenue.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Impuestos (20%)</p>
              <p className="text-2xl font-bold">
                ${(stats.monthlyRevenue * 0.2).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Costos Operativos</p>
              <p className="text-2xl font-bold">$89.00</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ingresos Netos</p>
              <p className="text-2xl font-bold text-green-600">
                ${(stats.monthlyRevenue * 0.8 - 89).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
