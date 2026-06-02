interface TeamMemberProps {
  name: string;
  role: string;
  image?: string;
  links?: {
    website?: string;
  };
}

function TeamMember({ name, role, image, links }: TeamMemberProps) {
  const websiteLink = links?.website;
  
  const ImageContent = (
    <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-[--color-border]">
      {image ? (
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[--color-text-muted] text-4xl font-medium">
          {name.split(' ').map(n => n[0]).join('')}
        </div>
      )}
    </div>
  );

  const NameContent = (
    <h3 className="text-lg font-semibold text-[--color-text-primary]">
      {name}
    </h3>
  );

  return (
    <div className="text-center">
      {websiteLink ? (
        <a href={websiteLink} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
          {ImageContent}
        </a>
      ) : (
        ImageContent
      )}
      
      {websiteLink ? (
        <a href={websiteLink} target="_blank" rel="noopener noreferrer" className="hover:text-[--color-accent] transition-colors">
          {NameContent}
        </a>
      ) : (
        NameContent
      )}
      <p className="text-[--color-text-secondary] text-sm">
        {role}
      </p>
    </div>
  );
}

export function Team() {
  const team = [
    {
      name: 'Nikolaj Jensen',
      role: 'Co-founder',
      image: '/team/nikolaj.jpg',
      links: {
        website: 'https://nikolajjensen.com',
      },
    },
    {
      name: 'Paolo Perrone',
      role: 'Co-founder',
      image: '/team/paolo.jpg',
      links: {
        website: 'https://paoloperrone.org',
      },
    },
  ];

  return (
    <section id="team" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-[--color-text-primary] mb-12 text-center">
          Team
        </h2>
        
        <div className="flex justify-center gap-16 md:gap-24">
          {team.map((member) => (
            <TeamMember key={member.name} {...member} />
          ))}
        </div>
      </div>
    </section>
  );
}
