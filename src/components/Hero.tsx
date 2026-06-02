export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center pt-20">
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-[--color-text-primary] tracking-tight mb-6">
          See the Structure
          <span className="block text-[--color-accent]">Make it Run</span>
        </h1>
        
        <p className="text-lg md:text-xl text-[--color-text-secondary] max-w-2xl mx-auto mb-10 leading-relaxed">
          Turning visual intuition into working code, with mathematical precision.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#projects"
            className="px-8 py-3 bg-[--color-accent] text-white font-medium rounded-lg hover:bg-[--color-accent-hover] transition-colors duration-200"
          >
            Our Projects
          </a>
          <a
            href="#about"
            className="px-8 py-3 border border-[--color-border] text-[--color-text-primary] font-medium rounded-lg hover:border-[--color-accent] hover:text-[--color-accent] transition-colors duration-200"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}
