import { Link } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlightDotsCode } from '../components/DotsHighlighter';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

// Dynamically import the standalone graph-editor
type DotsEditorType = import('@adjointlabs/graph-editor/standalone').DotsEditor;
type DiagramTheme = import('@adjointlabs/graph-editor/standalone').Theme;

function hexToRgb(h: string): [number, number, number] {
  const s = h.replace('#', '').trim();
  const full = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Linearly blend two hex colors (t in [0,1]); returns #rrggbb. */
function mix(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const ch = (i: number) => Math.round(pa[i] + (pb[i] - pa[i]) * t).toString(16).padStart(2, '0');
  return `#${ch(0)}${ch(1)}${ch(2)}`;
}

// Build the canvas theme from the site's --color-* CSS variables, which are
// defined per light/dark in index.css. Called inside the editor-init effect
// (after the .dark class toggle is applied) so it reflects the active theme.
// graph-editor renders to <canvas>, so it needs concrete colors, not CSS vars.
function buildDiagramTheme(): DiagramTheme {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  const primary = v('--color-text-primary', '#0f172a');
  const secondary = v('--color-text-secondary', '#475569');
  const muted = v('--color-text-muted', '#94a3b8');
  const accent = v('--color-accent', '#3b82f6');
  const background = v('--color-background', '#fafafa');
  const isDark = document.documentElement.classList.contains('dark');
  // A node reads as "something is here" by contrasting with the canvas
  // background (which is empty "space"): lighter in dark, darker in light.
  // Deriving from the background (not the UI panel color) keeps the feel
  // symmetric and, in dark, desaturates the fill vs the panel surface. The
  // stroke uses the SAME axis, a few steps further, so it shares the fill's
  // hue/saturation and just reads as a defined edge.
  const toward = isDark ? '#ffffff' : primary;
  const boxFill = mix(background, toward, isDark ? 0.1 : 0.07);
  const boxBorder = mix(background, toward, isDark ? 0.24 : 0.18);
  return {
    background,
    boxBorder,
    boxBorderSelected: accent,
    boxFill,
    boxFillSelected: accent + '22',
    // Subgraph border: same color as the box border, just thinner (graph-editor
    // draws cluster borders at a thinner line width).
    clusterBorder: boxBorder,
    // Subgraph interior reads as empty "space" (same as the canvas background),
    // so nested boxes look like they sit in a movable area.
    clusterFill: background,
    headerText: primary,
    typeText: muted,
    port: secondary,
    portHover: accent,
    portText: secondary,
    wire: primary,
    wireSelected: accent,
    wireLabel: muted,
    stub: muted,
    derivedWire: muted,
    error: '#dc2626',
    staleOverlay: background + '99',
    // Match the website's code font (Source Code Pro) on the diagram canvas.
    fontFamily: '"Source Code Pro", ui-monospace, monospace',
  };
}

const defaultCode = `// A monitored agent. The policy reasons internally, proposes
// an action, and an overseer must approve it — with the
// verdict looping back as feedback.
graph oversight {
  Agent :: Policy {
    port left goal
    port right action

    graph reasoning :: ChainOfThought {
      propose :: Step {
        port left in
        port right out
      }
      critique :: Step {
        port left in
        port right out
      }
      propose.out -> critique.in :: draft
    }
  }

  Monitor :: Overseer {
    port left action
    port right verdict
  }

  // Boundary wiring into the internal reasoning
  Agent.goal -> Agent.reasoning.propose.in
  Agent.reasoning.critique.out -> Agent.action

  // Oversight loop
  Agent.action -> Monitor.action :: proposed
  Monitor.verdict -> Agent.goal :: feedback
}`;

export function DotsPlayground() {
  const { theme } = useTheme();
  const [code, setCode] = useState(defaultCode);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [splitPercent, setSplitPercent] = useState(33);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
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
