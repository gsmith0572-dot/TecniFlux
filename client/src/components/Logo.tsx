import { Zap } from "lucide-react";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Zap className="w-6 h-6 text-primary fill-primary" />
        <div className="absolute inset-0 blur-md bg-primary/30 -z-10" />
      </div>
      <span className="font-bold text-xl tracking-tight">TecniFlux</span>
    </div>
  );
}
