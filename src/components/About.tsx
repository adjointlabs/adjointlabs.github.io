export function About() {
  return (
    <section id="about" className="py-24 bg-[--color-surface]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-[--color-text-primary] mb-6">
            About Us
          </h2>
          
          <div className="space-y-6 text-[--color-text-secondary] leading-relaxed">
            <p>
              Adjoint Labs is a technology company founded in Oxford, UK, 
              where we combine deep mathematical expertise with modern software engineering 
              to solve complex problems.
            </p>
            
            <p>
              Our team brings together researchers and engineers with backgrounds 
              in mathematics, computer science, and physics. We believe that 
              rigorous foundations lead to better solutions.
            </p>

            <p>
              Whether it's developing novel algorithms, building robust software systems, 
              or providing technical consulting, we approach every challenge with 
              precision and clarity.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
