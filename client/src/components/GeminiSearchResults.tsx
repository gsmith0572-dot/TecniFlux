import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Globe } from "lucide-react";
import WebResourceCard from "./WebResourceCard";

interface WebResource {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

interface GeminiSearchResult {
  summary: string;
  resources: WebResource[];
  searchQueries: string[];
}

interface GeminiSearchResultsProps {
  results: GeminiSearchResult;
}

export default function GeminiSearchResults({ results }: GeminiSearchResultsProps) {
  if (!results.resources || results.resources.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-secondary" />
        <h2 className="text-xl font-semibold">Recursos Adicionales de Internet</h2>
        <Badge variant="secondary" className="ml-2">
          <Globe className="w-3 h-3 mr-1" />
          Gemini AI
        </Badge>
      </div>

      {results.summary && (
        <Card className="p-4 bg-gradient-to-br from-card to-secondary/5 border-secondary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Resumen de IA</h3>
              <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-gemini-summary">
                {results.summary}
              </p>
            </div>
          </div>
        </Card>
      )}

      {results.searchQueries && results.searchQueries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Búsquedas realizadas:</span>
          {results.searchQueries.map((query, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {query}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {results.resources.map((resource, index) => (
          <WebResourceCard key={index} resource={resource} />
        ))}
      </div>
    </div>
  );
}
