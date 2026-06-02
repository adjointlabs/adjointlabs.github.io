import { Link } from 'react-router-dom';
import { useState, useRef, useCallback } from 'react';
import Editor from 'react-simple-code-editor';
import { highlightDotsCode } from '../components/DotsHighlighter';
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
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const editorRef = useRef<HTMLDivElement>(null);

  const lineCount = code.split('\n').length;

  const updateCursorPosition = useCallback(() => {
    const textarea = editorRef.current?.querySelector('textarea');
    if (textarea) {
      const pos = textarea.selectionStart;
      const textBefore = code.substring(0, pos);
      const lines = textBefore.split('\n');
      setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 });
    }
  }, [code]);

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
      <div className="flex-1 flex min-h-0">
        {/* Editor panel */}
        <div className="w-1/3 border-r border-[--color-border] flex flex-col">
          <div className="px-4 py-2 border-b border-[--color-border] bg-[--color-surface]">
            <span className="text-sm font-medium text-[--color-text-secondary]">Code</span>
          </div>
          <div 
            className="flex-1 flex overflow-hidden"
            style={{ boxShadow: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          >
            {/* Line numbers */}
            <div 
              className="flex-shrink-0 py-4 px-3 text-right select-none border-r border-[--color-border] bg-[--color-surface]/50"
              style={{ fontFamily: '"Source Code Pro", monospace', fontSize: 14, lineHeight: '21px' }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i + 1} className="text-[--color-text-muted]">
                  {i + 1}
                </div>
              ))}
            </div>
            {/* Editor */}
            <div 
              ref={editorRef}
              className="flex-1 overflow-auto playground-scrollbar"
              onClick={updateCursorPosition}
              onKeyUp={updateCursorPosition}
            >
              <Editor
                value={code}
                onValueChange={(newCode) => {
                  setCode(newCode);
                  setTimeout(updateCursorPosition, 0);
                }}
                highlight={highlightDotsCode}
                padding={16}
                style={{
                  fontFamily: '"Source Code Pro", monospace',
                  fontSize: 14,
                  lineHeight: '21px',
                  minHeight: '100%',
                }}
                className="focus:outline-none"
              />
            </div>
          </div>
          {/* Status bar */}
          <div className="flex-shrink-0 px-4 py-1.5 border-t border-[--color-border] bg-[--color-surface] flex items-center justify-between text-xs text-[--color-text-muted]">
            <span>DOTS</span>
            <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          </div>
        </div>

        {/* Preview panel */}
        <div className="w-2/3 flex flex-col">
          <div className="px-4 py-2 border-b border-[--color-border] bg-[--color-surface]">
            <span className="text-sm font-medium text-[--color-text-secondary]">Diagram</span>
          </div>
          <div 
            className="flex-1 flex items-center justify-center text-[--color-text-muted]"
            style={{ boxShadow: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          >
            <p>Diagram preview will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
