interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ServiceCard({ icon, title, description }: ServiceCardProps) {
  return (
    <div className="p-6 bg-[--color-surface] rounded-xl border border-[--color-border] hover:border-[--color-accent] transition-colors duration-200">
      <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-[--color-accent]/10 text-[--color-accent] mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-[--color-text-primary] mb-2">
        {title}
      </h3>
      <p className="text-[--color-text-secondary] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export function Services() {
  const services = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Software Development',
      description: 'Custom software solutions built with modern technologies, emphasising type safety, correctness, and maintainability.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Algorithm Design',
      description: 'Novel algorithms and data structures designed with mathematical rigour for optimal performance and reliability.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
      title: 'Technical Consulting',
      description: 'Expert guidance on architecture, best practices, and strategic technology decisions for your organisation.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      title: 'Research & Development',
      description: 'Cutting-edge research at the intersection of mathematics and computer science, tailored to your needs.',
    },
  ];

  return (
    <section id="services" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-[--color-text-primary] mb-12">
          What We Do
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <ServiceCard key={index} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
}
