export function Contact() {
  return (
    <section id="contact" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[--color-text-primary] mb-6">
            Contact
          </h2>
          
          <p className="text-[--color-text-secondary] mb-8 leading-relaxed">
            Interested in our work? Get in touch.
          </p>

          <a 
            href="mailto:hello@adjointlabs.com" 
            className="inline-flex items-center gap-3 text-lg text-[--color-accent] hover:underline"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            hello@adjointlabs.com
          </a>
        </div>
      </div>
    </section>
  );
}
