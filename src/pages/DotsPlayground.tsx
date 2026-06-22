import { Link } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlightDotsCode } from '../components/DotsHighlighter';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import '@sidecar/dots-editor/style.css';

// Dynamically import ELK and DotsEditor
type DotsEditorType = import('@sidecar/dots-editor').DotsEditor;

const defaultCode = `graph nested_example {
  // A loop-like box with inner structure
  loop {
    port in items :: default 
    port out output :: default
    
    subgraph body {
      // Two boxes inside the loop
      process {
        port in in :: default 
        port out out :: default
      }
      
      accumulate {
        port in in :: default
        port out result :: default
      }
     
      // Wire connecting them inside the subgraph
      loop.process.out -> loop.accumulate.in :: default
    }
  }
}`;

export function DotsPlayground() {
  const { theme } = useTheme();
  const [code, setCode] = useState(defaultCode);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [splitPercent, setSplitPercent] = useState(33);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [elkLoaded, setElkLoaded] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const dotsEditorRef = useRef<DotsEditorType | null>(null);
  const codeRef = useRef(code); // Keep latest code for theme changes

  // Track code for reinitialization
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  const lineCount = code.split('\n').length;

  // Load ELK first
  useEffect(() => {
    import('elkjs/lib/elk.bundled.js').then((ELK) => {
      // Set ELK as global for dots-editor
      (window as any).ELK = ELK.default || ELK;
      setElkLoaded(true);
    });
  }, []);

  // Initialize DOTS editor after ELK is loaded (reinitialize on theme change)
  useEffect(() => {
    if (!elkLoaded || !diagramRef.current) return;

    // Dispose previous editor on theme change
    if (dotsEditorRef.current) {
      dotsEditorRef.current.dispose();
      dotsEditorRef.current = null;
    }

    import('@sidecar/dots-editor').then(({ DotsEditor }) => {
      dotsEditorRef.current = new DotsEditor(diagramRef.current!, {
        onChange: (newDots) => {
          // When diagram changes, update the code editor
          setCode(newDots);
        }
      });

      // Load current code
      try {
        dotsEditorRef.current.loadFromDots(codeRef.current);
        setParseError(null);
      } catch (e) {
        setParseError((e as Error).message);
      }
    });

    return () => {
      dotsEditorRef.current?.dispose();
      dotsEditorRef.current = null;
    };
  }, [elkLoaded, theme]);

  // Update diagram when code changes (with debounce)
  useEffect(() => {
    if (!dotsEditorRef.current) return;

    const timeout = setTimeout(() => {
      try {
        dotsEditorRef.current?.loadFromDots(code);
        setParseError(null);
      } catch (e) {
        setParseError((e as Error).message);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [code]);

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
          <nav className="flex items-center gap-2 text-lg">
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
          <div className="px-4 py-2 border-b border-[--color-border] bg-[--color-surface] flex items-center h-10">
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
          <div className={`absolute top-0 bottom-0 w-px bg-[--color-border] group-hover:bg-[--color-text-muted] ${isDragging ? 'bg-[--color-accent]' : ''}`} style={{ left: '4px' }} />
        </div>

        {/* Preview panel */}
        <div 
          className="flex flex-col"
          style={{ width: `${100 - splitPercent}%` }}
        >
          <div className="px-4 py-2 border-b border-[--color-border] bg-[--color-surface] flex items-center justify-between h-10">
            <span className="text-sm font-medium text-[--color-text-secondary]">Diagram</span>
            {parseError && (
              <span className="text-xs text-red-500 truncate max-w-[200px]" title={parseError}>
                {parseError}
              </span>
            )}
          </div>
          <div 
            ref={diagramRef}
            className="flex-1"
            style={{ backgroundColor: 'var(--vscode-panel-background)' }}
          />
          {/* Status bar */}
          <div className="flex-shrink-0 px-4 py-1.5 border-t border-[--color-border] bg-[--color-surface] flex items-center justify-between text-xs text-[--color-text-muted]">
            <span>Preview</span>
            <span>DOTS Graph</span>
          </div>
        </div>
      </div>
    </div>
  );
}
