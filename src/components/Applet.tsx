export function Applet() {
  return (
    <section id="applet" className="py-24 bg-[--color-surface]">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-[--color-text-primary] mb-4 text-center">
          Interactive Demo
        </h2>
        <p className="text-[--color-text-secondary] text-center mb-12 max-w-2xl mx-auto">
          Explore our research through this interactive diagram tool.
        </p>
        
        {/* Placeholder for the applet */}
        <div className="aspect-[16/10] max-w-4xl mx-auto rounded-xl border-2 border-dashed border-[--color-border] flex items-center justify-center">
          <div className="text-center text-[--color-text-muted]">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">Coming Soon</p>
            <p className="text-sm mt-1">Interactive diagram tool</p>
          </div>
        </div>
      </div>
    </section>
  );
}
