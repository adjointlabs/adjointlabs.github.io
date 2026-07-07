import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center pt-20 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 py-20 text-center relative z-10">
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
            className="px-8 py-3 border border-[--color-border] text-[--color-text-primary] font-medium rounded-lg hover:border-[--color-accent] hover:text-[--color-accent] transition-colors duration-200"
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

        <div className="mt-6 flex justify-center">
          <Link
            to="/dots/playground"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[--color-accent] text-white font-medium rounded-lg hover:bg-[--color-accent-hover] transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Try DOTS Live Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
