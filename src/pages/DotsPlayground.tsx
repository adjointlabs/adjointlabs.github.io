import { Link } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlightDotsCode } from '../components/DotsHighlighter';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { buildDiagramTheme, buildExportTheme } from '../components/diagramTheme';

// Dynamically import the standalone graph-editor
type DotsEditorType = import('@adjointlabs/graph-editor/standalone').DotsEditor;

const OPEN: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const CLOSE: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

// Given the caret offset, return the offsets of the bracket adjacent to the
// caret (on either side) and its matching partner, or null if there is none.
function findBracketMatch(text: string, caret: number): [number, number] | null {
  for (const idx of [caret - 1, caret]) {
    const ch = text[idx];
    if (ch === undefined) continue;
    if (OPEN[ch]) {
      const close = OPEN[ch];
      let depth = 0;
      for (let i = idx; i < text.length; i++) {
        if (text[i] === ch) depth++;
        else if (text[i] === close && --depth === 0) return [idx, i];
      }
      return null;
    }
    if (CLOSE[ch]) {
      const open = CLOSE[ch];
      let depth = 0;
      for (let i = idx; i >= 0; i--) {
        if (text[i] === ch) depth++;
        else if (text[i] === open && --depth === 0) return [i, idx];
      }
      return null;
    }
  }
  return null;
}

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

// Split an attribute list's inner text on top-level commas, keeping commas
// that sit inside quoted values (e.g. pos="100,200") together.
function splitAttrEntries(inner: string): string[] {
  const out: string[] = [];
  let buf = '';
  let inStr = false;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (c === '"' && inner[i - 1] !== '\\') inStr = !inStr;
    if (c === ',' && !inStr) {
      out.push(buf);
      buf = '';
    } else {
      buf += c;
    }
  }
  out.push(buf);
  return out;
}

// Remove every `pos=...` attribute from the source so the layout engine
// re-arranges the boxes. Attribute lists left empty are dropped entirely.
function stripPositions(src: string): string {
  return src.replace(/[ \t]*\[([^\]]*)\]/g, (_whole, inner: string) => {
    const kept = splitAttrEntries(inner)
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && !/^pos\s*=/i.test(e));
    return kept.length > 0 ? ` [${kept.join(', ')}]` : '';
  });
}

export function DotsPlayground() {
  const { theme } = useTheme();
  const [code, setCode] = useState(defaultCode);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [matchPair, setMatchPair] = useState<[number, number] | null>(null);
  const [splitPercent, setSplitPercent] = useState(33);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [gridOn, setGridOn] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const dragDepth = useRef(0);
  const dotsEditorRef = useRef<DotsEditorType | null>(null);
  const codeRef = useRef(code); // Keep latest code for theme changes
  // Grid on/off, held in a ref so it survives the editor re-init on theme change.
  const gridOnRef = useRef(false);
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
        grid: { enabled: gridOnRef.current },
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
      setMatchPair(
        textarea.selectionStart === textarea.selectionEnd
          ? findBracketMatch(code, pos)
          : null,
      );
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

  const handleUndo = useCallback(() => dotsEditorRef.current?.undo(), []);
  const handleRedo = useCallback(() => dotsEditorRef.current?.redo(), []);

  // Toggle the snap grid (dots + center-snap on drag). Persist in a ref so a
  // later theme-driven re-init keeps the current state.
  const handleToggleGrid = useCallback(() => {
    setGridOn((on) => {
      const next = !on;
      gridOnRef.current = next;
      dotsEditorRef.current?.setGrid({ enabled: next });
      return next;
    });
  }, []);

  // Download the current diagram as a standalone SVG. Feature-detected so the
  // button degrades gracefully until the graph-editor dependency exposes
  // exportSvg (published `graph-editor-v*` tag). The file always uses the light
  // theme with a transparent page background, so it embeds legibly anywhere
  // (cluster interiors stay opaque).
  const handleDownloadSvg = useCallback(() => {
    const ed = dotsEditorRef.current as unknown as {
      exportSvg?: (opts?: { theme?: unknown; background?: boolean; margin?: number }) => string | null;
    } | null;
    const svg = ed?.exportSvg?.({ theme: buildExportTheme(), background: false });
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  // Download the current diagram as a bare `tikzpicture` (`.tex`), meant to be
  // \input into a LaTeX document (needs only \usepackage{tikz}). Feature-
  // detected so the button degrades gracefully until the graph-editor
  // dependency exposes exportTikz. Uses the light export theme with no
  // full-bleed page rect, matching the SVG export.
  const handleDownloadTikz = useCallback(() => {
    const ed = dotsEditorRef.current as unknown as {
      exportTikz?: (opts?: { theme?: unknown; background?: boolean; margin?: number }) => string | null;
    } | null;
    const tikz = ed?.exportTikz?.({ theme: buildExportTheme(), background: false });
    if (!tikz) return;
    const blob = new Blob([tikz], { type: 'application/x-tex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.tex';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  // Download the current diagram as a PNG raster. Feature-detected so the
  // button degrades gracefully until the graph-editor dependency exposes
  // exportPng. Uses the light export theme with a transparent page at 2x scale,
  // matching the SVG export (cluster interiors stay opaque).
  const handleDownloadPng = useCallback(async () => {
    const ed = dotsEditorRef.current as unknown as {
      exportPng?: (opts?: { theme?: unknown; background?: boolean; margin?: number; scale?: number }) => Promise<Blob | null>;
    } | null;
    const blob = await ed?.exportPng?.({ theme: buildExportTheme(), background: false, scale: 2 });
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  // Recover a diagram from an exported image dropped anywhere on the page:
  // PNG/SVG exports embed the DOTS source as metadata, so dropping one restores
  // it. A depth counter keeps the overlay steady as the cursor crosses the
  // pane's nested children (dragenter/leave fire per element).
  const isFileDrag = (e: React.DragEvent): boolean =>
    Array.from(e.dataTransfer?.types ?? []).includes('Files');
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragOver(true);
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (isFileDrag(e)) e.preventDefault();
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragOver(false);
    }
  }, []);
  const handleImportDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    const ed = dotsEditorRef.current as unknown as {
      importImageFile?: (f: File) => Promise<boolean>;
      importTikzFile?: (f: File) => Promise<boolean>;
      toDots?: () => string;
    } | null;
    if (!file || !ed) return;
    const isTikz = /\.(tex|tikz)$/i.test(file.name) || /x-tex$/.test(file.type);
    try {
      const ok = isTikz && ed.importTikzFile
        ? await ed.importTikzFile(file)
        : ed.importImageFile
          ? await ed.importImageFile(file)
          : false;
      if (!ok) {
        setParseError(
          isTikz
            ? 'That .tex is not a TikZ diagram exported from here.'
            : 'That image has no embedded DOTS (only diagrams exported from here carry it).',
        );
        return;
      }
      const dots = ed.toDots?.() ?? '';
      lastEmittedRef.current = dots;
      setCode(dots);
      setParseError(null);
      refreshDiagnostics();
    } catch (err) {
      setParseError((err as Error).message);
    }
  }, [refreshDiagnostics]);

  // Clear all `pos` attributes so the layout engine re-arranges every box.
  const handleAutoArrange = useCallback(() => {
    const cleaned = stripPositions(codeRef.current);
    const ed = dotsEditorRef.current;
    if (cleaned === codeRef.current) {
      ed?.zoomToFit();
      return;
    }
    // Skip the code-change reload echo; we apply the fresh layout directly.
    lastEmittedRef.current = cleaned;
    setCode(cleaned);
    if (!ed) return;
    try {
      // Full reset so every box is re-laid out; fit once the async layout lands.
      ed.loadFromDots(cleaned, { fit: true });
      setParseError(null);
      refreshDiagnostics();
    } catch (e) {
      setParseError((e as Error).message);
    }
  }, [refreshDiagnostics]);

  // Keyboard zoom: Cmd/Ctrl +/-/0 (in/out/fit). The canvas itself already
  // handles undo/redo (Cmd/Ctrl+Z, +Shift/Y), delete and escape when focused.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const ed = dotsEditorRef.current;
      if (!ed) return;
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        ed.setZoom(ed.getZoom() * 1.2);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        ed.setZoom(ed.getZoom() / 1.2);
      } else if (e.key === '0') {
        e.preventDefault();
        ed.zoomToFit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

      {/* Main content — drop an exported PNG/SVG anywhere here to recover it */}
      <div
        ref={containerRef}
        className="flex-1 flex min-h-0 relative"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleImportDrop}
      >
        {dragOver && (
          <div className="absolute inset-0 z-30 flex items-center justify-center border-2 border-dashed border-[--color-accent] bg-[--color-accent]/10 pointer-events-none">
            <span className="rounded-md bg-[--color-surface] px-4 py-2 text-sm font-medium text-[--color-accent] shadow-lg">
              Drop an exported PNG, SVG, or TikZ (.tex) to load its diagram
            </span>
          </div>
        )}
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
                highlight={(c) => highlightDotsCode(c, matchPair)}
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
            <div className="flex items-center gap-3 min-w-0">
              {parseError ? (
                <span className="text-xs text-red-500 truncate max-w-[200px]" title={parseError}>
                  {parseError}
                </span>
              ) : diagnostics.length > 0 ? (
                <span
                  className="text-xs text-amber-500 truncate max-w-[200px]"
                  title={diagnostics.join('\n')}
                >
                  ⚠ {diagnostics[0]}
                  {diagnostics.length > 1 ? ` (+${diagnostics.length - 1} more)` : ''}
                </span>
              ) : null}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleToggleGrid}
                  title={gridOn ? 'Grid: on (snap to grid)' : 'Grid: off'}
                  aria-label="Toggle grid"
                  aria-pressed={gridOn}
                  className={`p-1 rounded transition-colors ${gridOn ? 'text-[--color-accent] bg-[--color-background]' : 'text-[--color-text-secondary] hover:text-[--color-accent] hover:bg-[--color-background]'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M9 4v16M15 4v16M4 9h16M4 15h16" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleAutoArrange}
                  title="Auto-arrange (clear all positions)"
                  aria-label="Auto-arrange"
                  className="p-1 rounded text-[--color-text-secondary] hover:text-[--color-accent] hover:bg-[--color-background] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
                    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
                    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
                    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
                  </svg>
                </button>
                <span className="w-px h-4 bg-[--color-border] mx-0.5" aria-hidden="true" />
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setExportMenuOpen((o) => !o)}
                    title="Export diagram"
                    aria-label="Export diagram"
                    aria-haspopup="menu"
                    aria-expanded={exportMenuOpen}
                    className={`p-1 rounded flex items-center gap-0.5 transition-colors ${exportMenuOpen ? 'text-[--color-accent] bg-[--color-background]' : 'text-[--color-text-secondary] hover:text-[--color-accent] hover:bg-[--color-background]'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11l4 4 4-4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
                    </svg>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {exportMenuOpen && (
                    <>
                      {/* Backdrop closes the menu on outside click */}
                      <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)} />
                      <div
                        role="menu"
                        className="absolute right-0 top-full mt-1 z-20 min-w-[168px] py-1 rounded-md border border-[--color-border] bg-[--color-surface] shadow-lg"
                      >
                        <div className="px-3 py-1 text-[10px] uppercase tracking-wide text-[--color-text-muted]">Download as</div>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => { setExportMenuOpen(false); handleDownloadSvg(); }}
                          className="block w-full text-left px-3 py-1.5 text-[--color-text-secondary] hover:bg-[--color-background] hover:text-[--color-accent] transition-colors"
                        >
                          <span className="font-medium">SVG</span>
                          <span className="text-[--color-text-muted]"> · vector</span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => { setExportMenuOpen(false); handleDownloadPng(); }}
                          className="block w-full text-left px-3 py-1.5 text-[--color-text-secondary] hover:bg-[--color-background] hover:text-[--color-accent] transition-colors"
                        >
                          <span className="font-medium">PNG</span>
                          <span className="text-[--color-text-muted]"> · image (2×)</span>
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => { setExportMenuOpen(false); handleDownloadTikz(); }}
                          className="block w-full text-left px-3 py-1.5 text-[--color-text-secondary] hover:bg-[--color-background] hover:text-[--color-accent] transition-colors"
                        >
                          <span className="font-medium">TikZ</span>
                          <span className="text-[--color-text-muted]"> · LaTeX</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <span className="w-px h-4 bg-[--color-border] mx-0.5" aria-hidden="true" />
                <button
                  type="button"
                  onClick={handleUndo}
                  title="Undo (Ctrl/Cmd+Z)"
                  aria-label="Undo"
                  className="p-1 rounded text-[--color-text-secondary] hover:text-[--color-accent] hover:bg-[--color-background] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14L4 9l5-5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 9h11a5 5 0 0 1 0 10h-1" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  title="Redo (Ctrl/Cmd+Shift+Z)"
                  aria-label="Redo"
                  className="p-1 rounded text-[--color-text-secondary] hover:text-[--color-accent] hover:bg-[--color-background] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 14l5-5-5-5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 9H9a5 5 0 0 0 0 10h1" />
                  </svg>
                </button>
              </div>
            </div>
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
