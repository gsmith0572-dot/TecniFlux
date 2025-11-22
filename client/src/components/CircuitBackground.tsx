export function CircuitBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Main circuit pattern layer */}
      <svg className="absolute w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="circuit-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            {/* Large terminal nodes - increased opacity and stroke */}
            <circle cx="30" cy="30" r="8" fill="none" stroke="hsl(var(--primary))" strokeWidth="5" opacity="0.4" />
            <circle cx="170" cy="30" r="8" fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" opacity="0.4" />
            <circle cx="30" cy="170" r="8" fill="none" stroke="hsl(var(--primary))" strokeWidth="5" opacity="0.4" />
            <circle cx="170" cy="170" r="8" fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" opacity="0.4" />
            
            {/* Center hub */}
            <circle cx="100" cy="100" r="10" fill="none" stroke="hsl(var(--secondary))" strokeWidth="5" opacity="0.45" />
            <circle cx="100" cy="100" r="5" fill="hsl(var(--secondary))" opacity="0.35" />
            
            {/* Circuit traces - thicker strokes, higher opacity */}
            <path d="M 30 30 L 65 30 L 65 65 L 100 65 L 100 100" 
                  stroke="hsl(var(--primary))" strokeWidth="6" fill="none" opacity="0.4" strokeLinecap="round" />
            <path d="M 170 30 L 135 30 L 135 65 L 100 65 L 100 100" 
                  stroke="hsl(var(--secondary))" strokeWidth="6" fill="none" opacity="0.4" strokeLinecap="round" />
            <path d="M 30 170 L 65 170 L 65 135 L 100 135 L 100 100" 
                  stroke="hsl(var(--primary))" strokeWidth="6" fill="none" opacity="0.4" strokeLinecap="round" />
            <path d="M 170 170 L 135 170 L 135 135 L 100 135 L 100 100" 
                  stroke="hsl(var(--secondary))" strokeWidth="6" fill="none" opacity="0.4" strokeLinecap="round" />
            
            {/* Diagonal connections */}
            <path d="M 100 65 L 120 80 L 120 100" 
                  stroke="hsl(var(--primary))" strokeWidth="5" fill="none" opacity="0.35" strokeLinecap="round" />
            <path d="M 100 135 L 80 120 L 80 100" 
                  stroke="hsl(var(--secondary))" strokeWidth="5" fill="none" opacity="0.35" strokeLinecap="round" />
            
            {/* Small connection points */}
            <circle cx="65" cy="65" r="5" fill="hsl(var(--primary))" opacity="0.4" />
            <circle cx="135" cy="65" r="5" fill="hsl(var(--secondary))" opacity="0.4" />
            <circle cx="65" cy="135" r="5" fill="hsl(var(--primary))" opacity="0.4" />
            <circle cx="135" cy="135" r="5" fill="hsl(var(--secondary))" opacity="0.4" />
            <circle cx="120" cy="80" r="4" fill="hsl(var(--primary))" opacity="0.35" />
            <circle cx="80" cy="120" r="4" fill="hsl(var(--secondary))" opacity="0.35" />
          </pattern>
          
          {/* Reduced blur for sharper visibility */}
          <filter id="circuit-blur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit-pattern)" filter="url(#circuit-blur)" />
      </svg>
      
      {/* Ambient glow layers */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/8 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-secondary/8 blur-[120px] rounded-full" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-secondary/6 blur-[100px] rounded-full" />
    </div>
  );
}

export function LightningAccent({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 32"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.5 0L4 14.5h6.5L8.5 32L20 13h-7l1.5-13z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}
