import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MonthlyReport {
  month: string;
  year: number;
  totalRevenue: number;
  taxes: number;
  operatingCosts: number;
  netProfit: number;
  subscriptions: {
    free: number;
    premium: number;
    plus: number;
    pro: number;
  };
}

export default function AdminFinance() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());

  const { data: report, isLoading } = useQuery<MonthlyReport>({
    queryKey: ['/api/admin/finance/monthly-report', selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await fetch(
        `/api/admin/finance/monthly-report?year=${selectedYear}&month=${selectedMonth}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to fetch report');
      return res.json();
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-finance">Reportes Financieros</h1>
        <p className="text-muted-foreground mt-2">
          Análisis de ingresos, costos y ganancias mensuales
        </p>
      </div>

      <div className="flex gap-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-40" data-testid="select-month">
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32" data-testid="select-year">
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Cargando reporte...</div>
      ) : !report ? (
        <div className="text-center py-12">No hay datos disponibles para este período</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <AdminStatsCard
              title="Ingresos Brutos"
              value={formatCurrency(report.totalRevenue)}
              icon={DollarSign}
              description="Ingresos totales del mes"
            />
            <AdminStatsCard
              title="Impuestos (20%)"
              value={formatCurrency(report.taxes)}
              icon={TrendingDown}
              description="Retenciones fiscales"
            />
            <AdminStatsCard
              title="Costos Operativos"
              value={formatCurrency(report.operatingCosts)}
              icon={Calendar}
              description="Gastos fijos mensuales"
            />
            <AdminStatsCard
              title="Ganancia Neta"
              value={formatCurrency(report.netProfit)}
              icon={TrendingUp}
              description="Utilidad del período"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Suscripciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Plan Gratuito</span>
                  <span className="text-2xl font-bold" data-testid="stat-free">
                    {report.subscriptions.free}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Premium ($5.99/mes)</span>
                  <span className="text-2xl font-bold" data-testid="stat-premium">
                    {report.subscriptions.premium}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Plus ($9.99/mes)</span>
                  <span className="text-2xl font-bold" data-testid="stat-plus">
                    {report.subscriptions.plus}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Pro ($19.99/mes)</span>
                  <span className="text-2xl font-bold" data-testid="stat-pro">
                    {report.subscriptions.pro}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Desglose Financiero</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Ingresos Brutos</span>
                    <span className="font-medium">{formatCurrency(report.totalRevenue)}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Impuestos</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(report.taxes)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-destructive h-2 rounded-full"
                      style={{
                        width: `${(report.taxes / report.totalRevenue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Costos Operativos</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(report.operatingCosts)}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-destructive h-2 rounded-full"
                      style={{
                        width: `${(report.operatingCosts / report.totalRevenue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold">Ganancia Neta</span>
                    <span className="font-bold text-green-500">
                      {formatCurrency(report.netProfit)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
