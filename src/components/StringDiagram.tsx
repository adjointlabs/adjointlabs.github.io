export function StringDiagram() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.06] dark:opacity-[0.10]"
      viewBox="0 0 1000 800"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" strokeWidth="2" className="text-[--color-text-primary]">
        {/* Top flow */}
        <path d="M 250 150 L 300 150" />
        <path d="M 450 150 C 550 150, 650 210, 750 210" />
        <path d="M 900 210 L 950 210" />
        
        {/* Bottom flow */}
        <path d="M 50 650 L 100 650" />
        <path d="M 250 650 C 350 650, 450 710, 550 710" />
        <path d="M 700 710 L 750 710" />

        {/* Top boxes */}
        <rect x="300" y="110" width="150" height="80" rx="8" fill="none"/>
        <rect x="750" y="170" width="150" height="80" rx="8" fill="none"/>
        
        {/* Bottom boxes */}
        <rect x="100" y="610" width="150" height="80" rx="8" fill="none"/>
        <rect x="550" y="670" width="150" height="80" rx="8" fill="none"/>
        
        {/* Endpoint dots - top */}
        <circle cx="250" cy="150" r="3" fill="currentColor" />
        <circle cx="950" cy="210" r="3" fill="currentColor" />
        
        {/* Endpoint dots - bottom */}
        <circle cx="50" cy="650" r="3" fill="currentColor" />
        <circle cx="750" cy="710" r="3" fill="currentColor" />
      </g>
    </svg>
  );
}
