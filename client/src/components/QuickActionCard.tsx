import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  testId?: string;
}

export default function QuickActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  testId,
}: QuickActionCardProps) {
  return (
    <Card className="p-6 hover-elevate cursor-pointer transition-all border-primary/10 hover:border-primary/30 hover:shadow-[0_0_20px_rgba(46,139,255,0.15)]" onClick={onClick} data-testid={testId}>
      <div className="flex flex-col items-start gap-4">
        <div className="relative">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(46,139,255,0.2)]">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="absolute inset-0 blur-xl bg-primary/20 -z-10" />
        </div>
        
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        
        <Button variant="ghost" size="sm" className="mt-2 group" data-testid={`${testId}-button`}>
          Comenzar
          <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
        </Button>
      </div>
    </Card>
  );
}
