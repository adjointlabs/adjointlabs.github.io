import { Link } from 'react-router-dom';

interface ProjectProps {
  name: string;
  description: string;
  link: string;
}

function Project({ name, description, link }: ProjectProps) {
  return (
    <Link to={link} className="block">
      <div className="p-6 rounded-xl bg-[--color-surface] border border-[--color-border] hover:border-[--color-accent] transition-colors">
        <h3 className="text-xl font-semibold text-[--color-text-primary] mb-3">
          {name}
        </h3>
        <p className="text-[--color-text-secondary] leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}

export function Projects() {
  const projects = [
    {
      name: 'DOTS',
      description: 'A DSL for compositional, recursive diagrams.',
      link: '/dots',
    },
    {
      name: 'Sidecar',
      description: 'Round-trip code ↔ architecture visualization.',
      link: '/sidecar',
    },
  ];

  return (
    <section id="projects" className="py-24 bg-[--color-surface]">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-[--color-text-primary] mb-12 text-center">
          Projects
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {projects.map((project) => (
            <Project key={project.name} {...project} />
          ))}
        </div>
      </div>
    </section>
  );
}
