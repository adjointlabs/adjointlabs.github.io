export function CodeShowcase() {
  const codeExample = `// Type-safe configuration
interface Config {
  endpoint: string;
  timeout: number;
  retries?: number;
}

function createClient(config: Config) {
  return {
    async fetch<T>(path: string): Promise<T> {
      const response = await fetch(
        \`\${config.endpoint}\${path}\`
      );
      return response.json();
    }
  };
}`;

  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-[--color-text-primary] mb-4">
          Code That Speaks for Itself
        </h2>
        <p className="text-[--color-text-secondary] mb-8 max-w-2xl">
          We believe in writing clean, readable, and maintainable code. 
          Here's a glimpse of our approach.
        </p>

        <div className="relative">
          {/* Window chrome */}
          <div className="bg-[--color-surface] border border-[--color-border] rounded-t-xl px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-[--color-text-muted] text-sm font-mono ml-2">
              client.ts
            </span>
          </div>

          {/* Code block */}
          <pre className="bg-[--color-surface] border border-t-0 border-[--color-border] rounded-b-xl p-6 overflow-x-auto">
            <code className="font-mono text-sm leading-relaxed text-[--color-text-secondary]">
              {codeExample.split('\n').map((line, i) => (
                <div key={i} className="flex">
                  <span className="w-8 text-[--color-text-muted] select-none text-right pr-4">
                    {i + 1}
                  </span>
                  <span>
                    {highlightSyntax(line)}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}

// Simple syntax highlighting
function highlightSyntax(line: string) {
  const keywords = ['const', 'function', 'return', 'await', 'async', 'interface', 'string', 'number'];
  
  // Split line into parts, preserving the matches
  const parts = line.split(/(\/\/.*|['"`].*?['"`]|\b(?:const|function|return|await|async|interface|string|number)\b)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('//')) {
      return <span key={i} className="text-[--color-text-muted] italic">{part}</span>;
    }
    if (part.match(/^['"`].*['"`]$/)) {
      return <span key={i} className="text-green-500">{part}</span>;
    }
    if (keywords.includes(part)) {
      return <span key={i} className="text-[--color-accent] font-medium">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}
