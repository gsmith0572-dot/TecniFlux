import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Globe } from "lucide-react";

interface WebResource {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

interface WebResourceCardProps {
  resource: WebResource;
}

export default function WebResourceCard({ resource }: WebResourceCardProps) {
  const handleOpenResource = () => {
    window.open(resource.url, '_blank', 'noopener,noreferrer');
    console.log("Opening web resource:", resource.url);
  };

  return (
    <Card className="p-4 hover-elevate transition-all">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-secondary/10 flex-shrink-0">
          <Globe className="w-5 h-5 text-secondary" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm line-clamp-2" data-testid={`text-resource-title`}>
              {resource.title}
            </h3>
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              {resource.source}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {resource.snippet}
          </p>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleOpenResource}
            className="mt-2"
            data-testid={`button-open-resource`}
          >
            <ExternalLink className="mr-2 h-3 w-3" />
            Abrir Recurso
          </Button>
        </div>
      </div>
    </Card>
  );
}
