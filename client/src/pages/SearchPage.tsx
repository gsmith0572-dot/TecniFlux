import { useState } from "react";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import SearchFilters, { SearchFilterValues } from "@/components/SearchFilters";
import DiagramCard, { DiagramData } from "@/components/DiagramCard";
import PDFViewer from "@/components/PDFViewer";
import GeminiSearchResults from "@/components/GeminiSearchResults";
import { CircuitBackground } from "@/components/CircuitBackground";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { debugLog } from "@/utils/debugLog";

interface GeminiSearchResult {
  summary: string;
  resources: Array<{
    title: string;
    url: string;
    snippet: string;
    source: string;
  }>;
  searchQueries: string[];
}

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [results, setResults] = useState<DiagramData[]>([]);
  const [selectedDiagram, setSelectedDiagram] = useState<DiagramData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [geminiResults, setGeminiResults] = useState<GeminiSearchResult | null>(null);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [isLoadingDiagrams, setIsLoadingDiagrams] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (filters: SearchFilterValues) => {
    console.log("Searching with filters:", filters);
    setHasSearched(true);
    setIsLoadingDiagrams(true);
    setResults([]);
    setTotalResults(0);
    setErrorMessage(null);

    debugLog("SEARCH", `Search started: ${JSON.stringify(filters)}`, filters);

    // Buscar diagramas en la base de datos
    try {
      const response = await fetch("/api/diagrams/search", {
        method: "POST",
        body: JSON.stringify({
          query: filters.keyword,
          make: filters.make,
          model: filters.model,
          year: filters.year,
          system: filters.system,
          onlyComplete: filters.onlyComplete,
          limit: 50,
          offset: 0,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Error en la búsqueda");
      }

      const data = await response.json();
      setResults(data.diagrams || []);
      setTotalResults(data.total || 0);
      
      debugLog("SEARCH", `Search finished: ${data.total || 0} diagrams found`, {
        total: data.total,
        returned: data.diagrams?.length || 0,
      });
    } catch (error) {
      console.error("Error en búsqueda de diagramas:", error);
      setResults([]);
      setTotalResults(0);
      debugLog("ERROR", `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`, {
        filters,
      });
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : "Ocurrió un error al buscar diagramas. Intenta nuevamente."
      );
    } finally {
      setIsLoadingDiagrams(false);
    }

    // Buscar recursos adicionales con Gemini si tenemos suficiente información
    if (filters.make && filters.model && filters.year) {
      setIsLoadingGemini(true);
      setGeminiResults(null);
      
      try {
        const response = await fetch("/api/search/web", {
          method: "POST",
          body: JSON.stringify({
            make: filters.make,
            model: filters.model,
            year: filters.year,
            system: filters.system,
            keyword: filters.keyword,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Error en la búsqueda");
        }

        const data = await response.json() as GeminiSearchResult;
        setGeminiResults(data);
        console.log("Gemini search results:", response);
      } catch (error) {
        console.error("Error en búsqueda Gemini:", error);
        // No mostramos error al usuario, solo no mostramos resultados de Gemini
      } finally {
        setIsLoadingGemini(false);
      }
    }
  };

  const handleReset = () => {
    setResults([]);
    setHasSearched(false);
    setGeminiResults(null);
    setIsLoadingGemini(false);
    setIsLoadingDiagrams(false);
    setTotalResults(0);
    setErrorMessage(null);
  };

  if (selectedDiagram) {
    return <PDFViewer diagram={selectedDiagram} onClose={() => setSelectedDiagram(null)} />;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <CircuitBackground />
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Inicio
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Filtros de Búsqueda</h2>
              <SearchFilters 
                onSearch={handleSearch} 
                onReset={handleReset}
                isSearching={isLoadingDiagrams}
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {hasSearched ? "Resultados de Búsqueda" : "Listo para Buscar"}
                </h2>
                {totalResults > 0 && (
                  <p className="text-sm text-muted-foreground" data-testid="text-result-count">
                    {totalResults} diagrama{totalResults !== 1 ? "s" : ""} encontrado{totalResults !== 1 ? "s" : ""} 
                    {results.length < totalResults && ` (mostrando primeros ${results.length})`}
                  </p>
                )}
              </div>

              {!hasSearched ? (
                <div className="text-center py-16 space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Search className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Comienza tu Búsqueda</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Usa los filtros de la izquierda para buscar diagramas eléctricos automotrices por marca, modelo, año, sistema o palabras clave.
                    </p>
                  </div>
                </div>
              ) : isLoadingDiagrams ? (
                <div className="space-y-4">
                  <div className="tf-search-loader">
                    <div className="tf-search-loader-icon" />
                    <div className="flex flex-col gap-1">
                      <div className="tf-search-loader-text">
                        Buscando en la base TecniFlux…
                      </div>
                      <div className="tf-search-loader-subtext">
                        Esto puede tardar unos segundos
                      </div>
                    </div>
                  </div>
                </div>
              ) : errorMessage ? (
                <div className="space-y-4">
                  <div className="tf-search-error">
                    {errorMessage}
                  </div>
                  {results.length === 0 && (
                    <div className="text-center py-16 space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Search className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">No se Encontraron Resultados</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Intenta ajustar los filtros de búsqueda o usa diferentes palabras clave.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">No se Encontraron Resultados</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Intenta ajustar los filtros de búsqueda o usa diferentes palabras clave.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    {results.map((diagram) => (
                      <DiagramCard
                        key={diagram.id}
                        diagram={diagram}
                        onView={setSelectedDiagram}
                      />
                    ))}
                  </div>

                  {isLoadingGemini && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Buscando recursos adicionales en internet...
                      </span>
                    </div>
                  )}

                  {geminiResults && !isLoadingGemini && (
                    <GeminiSearchResults results={geminiResults} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
