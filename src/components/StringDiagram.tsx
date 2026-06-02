export function StringDiagram() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.04] dark:opacity-[0.07]"
      viewBox="0 0 1000 500"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Wires */}
      <g stroke="currentColor" strokeWidth="2" className="text-[--color-text-primary]">
        {/* Top flow */}
        <path d="M 30 70 L 100 70" />
        <path d="M 30 90 L 100 90" />
        <path d="M 180 70 C 220 70, 240 90, 280 90" />
        <path d="M 180 90 C 220 90, 240 110, 280 110" />
        <path d="M 380 90 L 480 90" />
        <path d="M 380 110 L 480 110" />
        <path d="M 560 100 L 680 100" />
        
        {/* Second row - offset */}
        <path d="M 30 180 L 140 180" />
        <path d="M 30 200 L 140 200" />
        <path d="M 220 180 L 340 180" />
        <path d="M 220 200 L 340 200" />
        <path d="M 420 180 C 480 180, 500 160, 560 160" />
        <path d="M 420 200 C 480 200, 500 180, 560 180" />
        <path d="M 660 160 L 780 160" />
        <path d="M 660 180 L 780 180" />
        <path d="M 880 170 L 970 170" />
        
        {/* Third row */}
        <path d="M 30 300 L 120 300" />
        <path d="M 200 290 C 260 290, 280 280, 340 280" />
        <path d="M 200 310 C 260 310, 280 320, 340 320" />
        <path d="M 440 280 L 540 280" />
        <path d="M 440 320 L 540 320" />
        <path d="M 620 290 L 740 290" />
        <path d="M 620 310 L 740 310" />
        <path d="M 840 300 L 940 300" />
        
        {/* Bottom flow - staggered */}
        <path d="M 30 410 L 80 410" />
        <path d="M 30 430 L 80 430" />
        <path d="M 160 410 L 260 410" />
        <path d="M 160 430 L 260 430" />
        <path d="M 360 420 L 500 420" />
        <path d="M 580 410 C 640 410, 660 400, 720 400" />
        <path d="M 580 430 C 640 430, 660 440, 720 440" />
        <path d="M 820 400 L 920 400" />
        <path d="M 820 440 L 920 440" />
      </g>
      
      {/* Boxes - loosely aligned */}
      <g className="text-[--color-text-primary]">
        {/* Row 1 */}
        <rect x="100" y="55" width="80" height="50" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="280" y="75" width="100" height="50" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="480" y="80" width="80" height="40" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        
        {/* Row 2 */}
        <rect x="140" y="165" width="80" height="50" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="340" y="165" width="80" height="50" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="560" y="145" width="100" height="50" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="780" y="150" width="100" height="50" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        
        {/* Row 3 */}
        <rect x="120" y="280" width="80" height="45" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="340" y="265" width="100" height="70" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="540" y="275" width="80" height="50" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="740" y="280" width="100" height="40" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        
        {/* Row 4 */}
        <rect x="80" y="395" width="80" height="50" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="260" y="400" width="100" height="40" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="500" y="395" width="80" height="50" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="720" y="385" width="100" height="70" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        
        {/* Input dots */}
        <circle cx="30" cy="70" r="4" fill="currentColor" />
        <circle cx="30" cy="90" r="4" fill="currentColor" />
        <circle cx="30" cy="180" r="4" fill="currentColor" />
        <circle cx="30" cy="200" r="4" fill="currentColor" />
        <circle cx="30" cy="300" r="4" fill="currentColor" />
        <circle cx="30" cy="410" r="4" fill="currentColor" />
        <circle cx="30" cy="430" r="4" fill="currentColor" />
        
        {/* Output dots */}
        <circle cx="680" cy="100" r="4" fill="currentColor" />
        <circle cx="970" cy="170" r="4" fill="currentColor" />
        <circle cx="940" cy="300" r="4" fill="currentColor" />
        <circle cx="920" cy="400" r="4" fill="currentColor" />
        <circle cx="920" cy="440" r="4" fill="currentColor" />
      </g>
    </svg>
  );
}
