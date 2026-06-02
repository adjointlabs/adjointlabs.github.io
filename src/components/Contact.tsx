export function Contact() {
  return (
    <section id="contact" className="py-24 bg-[--color-surface]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-[--color-text-primary] mb-6">
            Get in Touch
          </h2>
          
          <p className="text-[--color-text-secondary] mb-8 leading-relaxed">
            Interested in working together? We'd love to hear from you. 
            Reach out to discuss your project or just say hello.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[--color-accent]/10 text-[--color-accent]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <a 
                href="mailto:hello@adjointlabs.com" 
                className="text-[--color-text-primary] hover:text-[--color-accent] transition-colors duration-200"
              >
                hello@adjointlabs.com
              </a>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[--color-accent]/10 text-[--color-accent]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-[--color-text-primary]">
                Oxford, United Kingdom
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
