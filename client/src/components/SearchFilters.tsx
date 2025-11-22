import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, X } from "lucide-react";

interface SearchFiltersProps {
  onSearch: (filters: SearchFilterValues) => void;
  onReset: () => void;
  isSearching?: boolean;
}

export interface SearchFilterValues {
  make: string;
  model: string;
  year: string;
  system: string;
  keyword: string;
  onlyComplete: boolean;
}

export default function SearchFilters({ onSearch, onReset, isSearching = false }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilterValues>({
    make: "all",
    model: "",
    year: "all",
    system: "all",
    keyword: "",
    onlyComplete: false,
  });

  const {
    data: filterOptions,
    isLoading: filtersLoading,
    isError,
  } = useQuery<{
    makes: string[];
    systems: string[];
    years: string[];
  }>({
    queryKey: ["/api/diagrams/filters"],
    queryFn: async () => {
      const res = await fetch("/api/diagrams/filters", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("No se pudieron cargar los filtros");
      }
      return res.json();
    },
  });

  const filteredYears = useMemo(() => {
    if (!filterOptions?.years || filterOptions.years.length === 0) return [];

    const numericYears = filterOptions.years
      .map((y: string) => parseInt(y, 10))
      .filter((n) => !isNaN(n));

    if (numericYears.length === 0) return [];

    const minYear = Math.min(...numericYears);
    const maxYear = Math.min(2026, Math.max(...numericYears, 2026));

    const years: string[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      years.push(String(y));
    }
    return years;
  }, [filterOptions?.years]);

  const handleSearch = () => {
    const searchFilters = {
      ...filters,
      make: filters.make === "all" ? "" : filters.make,
      year: filters.year === "all" ? "" : filters.year,
      system: filters.system === "all" ? "" : filters.system,
    };
    onSearch(searchFilters);
  };

  const handleReset = () => {
    setFilters({
      make: "all",
      model: "",
      year: "all",
      system: "all",
      keyword: "",
      onlyComplete: false,
    });
    onReset();
  };

  const selectClassName =
    "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="keyword">Búsqueda por Palabra Clave</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="keyword"
              placeholder="Buscar diagramas..."
              className="pl-9"
              value={filters.keyword}
              onChange={(e) =>
                setFilters({ ...filters, keyword: e.target.value })
              }
              data-testid="input-keyword"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="make">Marca</Label>
          <select
            id="make"
            className={selectClassName}
            value={filters.make}
            onChange={(e) =>
              setFilters({ ...filters, make: e.target.value })
            }
            disabled={filtersLoading}
            data-testid="select-make"
          >
            <option value="all">
              {filtersLoading ? "Cargando..." : "Todas las marcas"}
            </option>
            {filterOptions?.makes?.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Modelo</Label>
          <Input
            id="model"
            placeholder="Ingresa el modelo"
            value={filters.model}
            onChange={(e) =>
              setFilters({ ...filters, model: e.target.value })
            }
            data-testid="input-model"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Año</Label>
          <select
            id="year"
            className={selectClassName}
            value={filters.year}
            onChange={(e) =>
              setFilters({ ...filters, year: e.target.value })
            }
            disabled={filtersLoading}
            data-testid="select-year"
          >
            <option value="all">
              {filtersLoading ? "Cargando..." : "Todos los años"}
            </option>
            {filteredYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="system">Sistema</Label>
          <select
            id="system"
            className={selectClassName}
            value={filters.system}
            onChange={(e) =>
              setFilters({ ...filters, system: e.target.value })
            }
            disabled={filtersLoading}
            data-testid="select-system"
          >
            <option value="all">
              {filtersLoading ? "Cargando..." : "Todos los sistemas"}
            </option>
            {filterOptions?.systems?.map((system) => (
              <option key={system} value={system}>
                {system}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="only-complete"
            checked={filters.onlyComplete}
            onCheckedChange={(checked) =>
              setFilters({ ...filters, onlyComplete: checked === true })
            }
            data-testid="checkbox-only-complete"
          />
          <Label
            htmlFor="only-complete"
            className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Solo diagramas completos
          </Label>
        </div>

        {isError && (
          <p className="text-xs text-red-400">
            No se pudieron cargar los filtros automáticos. Puedes buscar por
            palabra clave o modelo igualmente.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSearch}
          className="flex-1"
          isLoading={isSearching}
          loadingText="Buscando…"
          data-testid="button-search"
        >
          <Search className="mr-2 h-4 w-4" />
          Buscar
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          disabled={isSearching}
          data-testid="button-reset"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
