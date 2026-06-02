import { Link } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';
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
  const [splitPercent, setSplitPercent] = useState(33);
  const [isDragging, setIsDragging] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    // Clamp between 20% and 80%
    setSplitPercent(Math.min(80, Math.max(20, percent)));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="min-h-screen bg-[--color-background] flex flex-col">
      {/* Accent line */}
      <div className="h-[3px] bg-[--color-accent] flex-shrink-0" />
      
      {/* Unified header with breadcrumb */}
      <header className="flex-shrink-0 border-b border-[--color-border] bg-[--color-surface]">
        <div className="px-4 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm">
            <Link 
              to="/dots" 
              className="text-[--color-text-secondary] hover:text-[--color-accent] transition-colors"
            >
              DOTS
            </Link>
            <span className="text-[--color-text-muted]">/</span>
            <span className="font-medium text-[--color-text-primary]">Playground</span>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <div ref={containerRef} className="flex-1 flex min-h-0">
        {/* Editor panel */}
        <div 
          className="flex flex-col"
          style={{ width: `${splitPercent}%` }}
        >
          <div className="px-4 py-2 border-b border-[--color-border] bg-[--color-surface]">
            <span className="text-sm font-medium text-[--color-text-secondary]">Code</span>
          </div>
          <div 
            className="flex-1 flex overflow-hidden"
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

        {/* Resizable divider */}
        <div
          onMouseDown={handleMouseDown}
          className="flex-shrink-0 cursor-col-resize group relative"
          style={{ width: '9px', marginLeft: '-4px', marginRight: '-4px' }}
        >
          <div className={`absolute top-0 bottom-0 w-px bg-[--color-border] group-hover:bg-[--color-accent] ${isDragging ? 'bg-[--color-accent]' : ''}`} style={{ left: '4px' }} />
        </div>

        {/* Preview panel */}
        <div 
          className="flex flex-col"
          style={{ width: `${100 - splitPercent}%` }}
        >
          <div className="px-4 py-2 border-b border-[--color-border] bg-[--color-surface]">
            <span className="text-sm font-medium text-[--color-text-secondary]">Diagram</span>
          </div>
          <div 
            className="flex-1 flex items-center justify-center text-[--color-text-muted]"
          >
            <p>Diagram preview will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
