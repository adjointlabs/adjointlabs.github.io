import { Link } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlightDotsCode } from '../components/DotsHighlighter';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { buildDiagramTheme } from '../components/diagramTheme';

// Dynamically import the standalone graph-editor
type DotsEditorType = import('@adjointlabs/graph-editor/standalone').DotsEditor;

const defaultCode = `// A guarded LLM pipeline. The model's reasoning is a nested
// graph with its own boundary ports (in/out), wired through
// its internal steps; a safety classifier screens the output.
graph safety {
  Prompt :: Input {
    port right text
  }

  Model :: LLM {
    port left prompt
    port right output

    graph reasoning :: ChainOfThought {
      port left in
      port right out

      draft :: Step {
        port left in
        port right out
      }
      revise :: Step {
        port left in
        port right out
      }

      in -> draft.in
      draft.out -> revise.in :: candidate
      revise.out -> out
    }
  }

  Guard :: SafetyFilter {
    port left input
    port right approved
  }

  Response :: Output {
    port left text
  }

  // Feed-forward flow
  Prompt.text -> Model.prompt :: query
  Model.output -> Guard.input :: candidate
  Guard.approved -> Response.text :: safe
}`;

export function DotsPlayground() {
  const { theme } = useTheme();
  const [code, setCode] = useState(defaultCode);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [splitPercent, setSplitPercent] = useState(33);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const dotsEditorRef = useRef<DotsEditorType | null>(null);
  const codeRef = useRef(code); // Keep latest code for theme changes
  // Last DOTS text the editor itself emitted via onChange. Used to skip the
  // self-echo reload below (the editor already holds this text).
  const lastEmittedRef = useRef<string | null>(null);

  // Track code for reinitialization
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  const lineCount = code.split('\n').length;

  // Collect error-severity diagnostics (e.g. edge endpoints that don't
  // resolve, which otherwise render as no wire, silently).
  const refreshDiagnostics = useCallback(() => {
    const diags = dotsEditorRef.current?.getDiagnostics() ?? [];
    setDiagnostics(diags.filter((d) => d.severity === 'error').map((d) => d.message));
  }, []);

  // Initialize the DOTS editor (reinitialize on theme change).
  // graph-editor/standalone bundles ELK itself, so no global setup is needed.
  useEffect(() => {
    if (!diagramRef.current) return;

    // Dispose previous editor on theme change
    if (dotsEditorRef.current) {
      dotsEditorRef.current.dispose();
      dotsEditorRef.current = null;
    }

    import('@adjointlabs/graph-editor/standalone').then(({ DotsEditor }) => {
      dotsEditorRef.current = new DotsEditor(diagramRef.current!, {
        theme: buildDiagramTheme(),
        onViewportChange: (z) => setZoom(z),
        onChange: (newDots) => {
          // When diagram changes, update the code editor. Record it so the
          // reload effect below doesn't feed the editor's own output back in.
          lastEmittedRef.current = newDots;
          setCode(newDots);
          refreshDiagnostics();
        }
      });

      // Load current code
      try {
        dotsEditorRef.current.loadFromDots(codeRef.current);
        setParseError(null);
        refreshDiagnostics();
      } catch (e) {
        setParseError((e as Error).message);
      }
    });

    return () => {
      dotsEditorRef.current?.dispose();
      dotsEditorRef.current = null;
    };
  }, [theme]);

  // Update diagram when code changes (with debounce)
  useEffect(() => {
    if (!dotsEditorRef.current) return;
    // Skip reloads for text the editor itself emitted (self-echo): the
    // standalone editor already holds it. Reloading would re-parse and reset
    // model ids, desyncing in-flight drags (setPos on a stale id throws
    // "element cannot carry attributes"). Only user edits in the code pane
    // (where code differs from the last emitted text) should reload.
    if (code === lastEmittedRef.current) return;

    const timeout = setTimeout(() => {
      try {
        // Incremental, echo-detected update (extension-style): keeps node ids,
        // selection and on-canvas positions across code-pane edits, unlike
        // loadFromDots which fully resets the model.
        dotsEditorRef.current?.applyExternalText(code);
        setParseError(null);
        refreshDiagnostics();
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

  // Zoom controls for the diagram status bar.
  const applyZoom = useCallback((z: number) => {
    dotsEditorRef.current?.setZoom(z);
    setZoomMenuOpen(false);
  }, []);

  const zoomToFit = useCallback(() => {
    dotsEditorRef.current?.zoomToFit();
    setZoomMenuOpen(false);
  }, []);

  const handleZoomWheel = useCallback((e: React.WheelEvent) => {
    const ed = dotsEditorRef.current;
    if (!ed) return;
    // Same multiplicative feel as wheel-zoom on the canvas.
    ed.setZoom(ed.getZoom() * Math.exp(-e.deltaY * 0.0015));
  }, []);

  const zoomPresets = [0.5, 0.75, 1, 1.25, 1.5, 2];

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
            {parseError ? (
              <span className="text-xs text-red-500 truncate max-w-[240px]" title={parseError}>
                {parseError}
              </span>
            ) : diagnostics.length > 0 ? (
              <span
                className="text-xs text-amber-500 truncate max-w-[240px]"
                title={diagnostics.join('\n')}
              >
                ⚠ {diagnostics[0]}
                {diagnostics.length > 1 ? ` (+${diagnostics.length - 1} more)` : ''}
              </span>
            ) : null}
          </div>
          <div 
            ref={diagramRef}
            className="flex-1"
            style={{ backgroundColor: 'var(--vscode-panel-background)' }}
          />
          {/* Status bar */}
          <div className="flex-shrink-0 px-4 py-1.5 border-t border-[--color-border] bg-[--color-surface] flex items-center justify-between text-xs text-[--color-text-muted]">
            <div className="relative">
              <button
                type="button"
                onClick={() => setZoomMenuOpen((o) => !o)}
                onWheel={handleZoomWheel}
                title="Zoom — click to choose, scroll to adjust"
                className="tabular-nums cursor-pointer hover:text-[--color-text-secondary] transition-colors"
              >
                {Math.round(zoom * 100)}%
              </button>
              {zoomMenuOpen && (
                <>
                  {/* Backdrop closes the menu on outside click */}
                  <div className="fixed inset-0 z-10" onClick={() => setZoomMenuOpen(false)} />
                  <div className="absolute bottom-full left-0 mb-1 z-20 min-w-[88px] py-1 rounded-md border border-[--color-border] bg-[--color-surface] shadow-lg">
                    {zoomPresets.map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => applyZoom(z)}
                        className={`block w-full text-left px-3 py-1 tabular-nums hover:bg-[--color-background] transition-colors ${
                          Math.round(zoom * 100) === Math.round(z * 100)
                            ? 'text-[--color-accent]'
                            : 'text-[--color-text-secondary]'
                        }`}
                      >
                        {Math.round(z * 100)}%
                      </button>
                    ))}
                    <div className="my-1 border-t border-[--color-border]" />
                    <button
                      type="button"
                      onClick={zoomToFit}
                      className="block w-full text-left px-3 py-1 text-[--color-text-secondary] hover:bg-[--color-background] transition-colors"
                    >
                      Fit
                    </button>
                  </div>
                </>
              )}
            </div>
            <span>DOTS Graph</span>
          </div>
        </div>
      </div>
    </div>
  );
}
