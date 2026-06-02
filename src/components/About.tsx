export function About() {
  return (
    <section id="about" className="py-24 bg-[--color-surface]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-[--color-text-primary] mb-6">
            About
          </h2>
          
          <div className="space-y-6 text-[--color-text-secondary] leading-relaxed">
            <p>
              Adjoint Labs is a research company based in Oxford, UK. 
              We develop formal languages and tools for working with 
              diagrams, structure, and code.
            </p>
            
            <p>
              We are funded by{' '}
              <a 
                href="https://www.aria.org.uk/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[--color-accent] hover:underline"
              >
                ARIA
              </a>
              {' '}(the UK's Advanced Research + Invention Agency) as part of the{' '}
              <a 
                href="https://www.aria.org.uk/programme-safeguarded-ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[--color-accent] hover:underline"
              >
                Safeguarded AI
              </a>
              {' '}programme, which aims to build mathematically grounded 
              approaches to AI safety.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
