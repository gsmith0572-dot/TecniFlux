import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, Eye, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Diagram } from '@shared/schema';
import DiagramDetailDialog from '@/components/DiagramDetailDialog';

const ITEMS_PER_PAGE = 20;

export default function AdminDiagrams() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [makeFilter, setMakeFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [selectedDiagram, setSelectedDiagram] = useState<Diagram | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Fetch filter options
  const { data: filterOptions } = useQuery<any>({
    queryKey: ['/api/diagrams/filters'],
  });

  const filteredYears = useMemo(() => {
    if (!filterOptions?.years || filterOptions.years.length === 0) return [];

    const numericYears = filterOptions.years
      .map((y: string) => parseInt(y, 10))
      .filter((n: number) => !isNaN(n));

    if (numericYears.length === 0) return [];

    const minYear = Math.min(...numericYears);
    const maxYear = Math.min(2026, Math.max(...numericYears, 2026));

    const years: string[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      years.push(String(y));
    }
    return years;
  }, [filterOptions?.years]);

  // Fetch diagrams with search and filters
  const { data: diagramsData, isLoading, refetch } = useQuery({
    queryKey: [
      '/api/admin/diagrams',
      {
        query: searchQuery,
        make: makeFilter,
        year: yearFilter,
        status: statusFilter,
        limit: ITEMS_PER_PAGE,
        offset: page * ITEMS_PER_PAGE,
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: (page * ITEMS_PER_PAGE).toString(),
      });
      
      if (searchQuery) params.append('query', searchQuery);
      if (makeFilter && makeFilter !== 'all') params.append('make', makeFilter);
      if (yearFilter && yearFilter !== 'all') params.append('year', yearFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/admin/diagrams?${params}`, {
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('Failed to fetch diagrams');
      return res.json();
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/diagrams/sync', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al sincronizar');
      }
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Sincronización exitosa',
        description: `${data.total || 0} diagramas procesados`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/diagrams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/diagrams/stats'] });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al sincronizar',
        description: error.message || 'Error desconocido',
        variant: 'destructive',
      });
    },
  });

  const handleSearch = () => {
    setPage(0);
    refetch();
  };

  const handleReset = () => {
    setSearchQuery('');
    setMakeFilter('all');
    setYearFilter('all');
    setStatusFilter('all');
    setPage(0);
  };

  const handleViewDiagram = (diagram: Diagram) => {
    setSelectedDiagram(diagram);
    setDetailDialogOpen(true);
  };

  const totalPages = diagramsData?.total ? Math.ceil(diagramsData.total / ITEMS_PER_PAGE) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-admin-diagrams">
            Gestión de Diagramas
          </h1>
          <p className="text-muted-foreground">
            {diagramsData?.total || 0} diagramas en total
          </p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          data-testid="button-sync-diagrams"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Sincronizando...' : 'Sync Now'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Buscar por texto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                data-testid="input-search-diagrams"
              />
            </div>
            
            <Select value={makeFilter} onValueChange={setMakeFilter}>
              <SelectTrigger data-testid="select-make-filter">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {filterOptions?.makes?.map((make: string) => (
                  <SelectItem key={make} value={make}>
                    {make}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger data-testid="select-year-filter">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los años</SelectItem>
                {filteredYears.map((year: string) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="complete">Completo</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch} data-testid="button-apply-filters">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
            <Button variant="outline" onClick={handleReset} data-testid="button-reset-filters">
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : diagramsData?.diagrams?.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Archivo</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Año</TableHead>
                      <TableHead>Sistema</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diagramsData.diagrams.map((diagram: Diagram) => (
                      <TableRow key={diagram.id} data-testid={`row-diagram-${diagram.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate max-w-[200px]" title={diagram.fileName}>
                              {diagram.fileName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{diagram.make || 'Desconocido'}</TableCell>
                        <TableCell>{diagram.model || 'Desconocido'}</TableCell>
                        <TableCell>{diagram.year || 'Desconocido'}</TableCell>
                        <TableCell>{diagram.system || 'Desconocido'}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={diagram.status === 'complete' ? 'default' : 'secondary'}
                            data-testid={`badge-status-${diagram.status}`}
                          >
                            {diagram.status === 'complete' ? 'Completo' : 'Parcial'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDiagram(diagram)}
                            data-testid={`button-view-${diagram.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {page * ITEMS_PER_PAGE + 1} a {Math.min((page + 1) * ITEMS_PER_PAGE, diagramsData.total)} de {diagramsData.total} resultados
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Página {page + 1} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages - 1}
                    data-testid="button-next-page"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron diagramas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDiagram && (
        <DiagramDetailDialog
          diagram={selectedDiagram}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
        />
      )}
    </div>
  );
}
