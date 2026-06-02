import { Link } from 'react-router-dom';
import { useState } from 'react';
import { DotsHighlighter } from '../components/DotsHighlighter';
import { ThemeToggle } from '../components/ThemeToggle';

const defaultCode = `graph example {
    Alice :: Person {
        port out :: default [dir=out]
    }
    
    Bob :: Person {
        port in :: default [dir=in]
        port out :: default [dir=out]
    }
    
    Carol :: Person {
        port in :: default [dir=in]
    }
    
    Alice.out -> Bob.in :: knows
    Bob.out -> Carol.in :: knows
}`;

export function DotsPlayground() {
  const [code, setCode] = useState(defaultCode);

  return (
    <div className="min-h-screen bg-[--color-background] flex flex-col">
      {/* Minimal header */}
      <header className="flex-shrink-0 border-b border-[--color-border] bg-[--color-surface]">
        <div className="px-4 py-2 border-b border-[--color-border]">
          <Link 
            to="/dots" 
            className="text-sm text-[--color-text-secondary] hover:text-[--color-accent] transition-colors"
          >
            ← Back to DOTS
          </Link>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[--color-text-primary]">
            DOTS Playground
          </h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Editor panel */}
        <div className="w-1/3 border-r border-[--color-border] flex flex-col">
          <div className="px-4 py-2 border-b border-[--color-border] bg-[--color-surface]">
            <span className="text-sm font-medium text-[--color-text-secondary]">Code</span>
          </div>
          <div className="flex-1 relative overflow-auto">
            {/* Highlighted code underneath */}
            <div className="absolute inset-0 p-4 pointer-events-none">
              <DotsHighlighter code={code} bare />
            </div>
            {/* Transparent textarea on top */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-[--color-text-primary] font-mono text-sm resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Preview panel */}
        <div className="w-2/3 flex flex-col">
          <div className="px-4 py-2 border-b border-[--color-border] bg-[--color-surface]">
            <span className="text-sm font-medium text-[--color-text-secondary]">Diagram</span>
          </div>
          <div className="flex-1 flex items-center justify-center text-[--color-text-muted]">
            <p>Diagram preview will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
