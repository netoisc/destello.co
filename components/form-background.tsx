"use client";

export default function FormBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      {/* Abstract lines and dots pattern */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid-pattern"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.1)" />
          </pattern>
          <pattern
            id="lines-pattern"
            x="0"
            y="0"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="100"
              y2="100"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="0.5"
            />
            <line
              x1="100"
              y1="0"
              x2="0"
              y2="100"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        
        {/* Grid dots */}
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        
        {/* Diagonal lines */}
        <rect width="100%" height="100%" fill="url(#lines-pattern)" />
        
        {/* Random dots/particles */}
        {Array.from({ length: 50 }).map((_, i) => {
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const size = Math.random() * 2 + 0.5;
          return (
            <circle
              key={i}
              cx={`${x}%`}
              cy={`${y}%`}
              r={size}
              fill="rgba(255,255,255,0.15)"
              opacity={Math.random() * 0.5 + 0.3}
            >
              <animate
                attributeName="opacity"
                values={`${Math.random() * 0.5 + 0.3};${Math.random() * 0.8 + 0.5};${Math.random() * 0.5 + 0.3}`}
                dur={`${Math.random() * 3 + 2}s`}
                repeatCount="indefinite"
              />
            </circle>
          );
        })}
      </svg>
    </div>
  );
}

