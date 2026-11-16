import { Link } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlightPythonCode } from '../components/PythonHighlighter';
import { highlightDotsCode } from '../components/DotsHighlighter';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { buildDiagramTheme, buildExportTheme } from '../components/diagramTheme';
import treeSitterWasmUrl from 'web-tree-sitter/web-tree-sitter.wasm?url';
import pythonWasmUrl from '@adjointlabs/sidecar-python/tree-sitter-python.wasm?url';

// Dynamically imported: the standalone graph-editor, its core (domain
// registry), and the Python lens on web-tree-sitter. All three resolve the
// same graph-editor module instance, so the registered domain is the one the
// editor sees.
type DotsEditorType = import('@adjointlabs/graph-editor/standalone').DotsEditor;
type SelectedElementType = import('@adjointlabs/graph-editor/standalone').SelectedElement;
type EditorModule = typeof import('@adjointlabs/graph-editor');
type PythonModule = typeof import('@adjointlabs/sidecar-python/web');

const defaultPython = `# Center a list of numbers around its mean.

def mean(xs):
    total = 0
    for x in xs:
        total = total + x
    return total / len(xs)

def centered(xs):
    m = mean(xs)
    out = []
    for x in xs:
        out.append(x - m)
    return out

data = [3, 1, 4, 1, 5, 9, 2, 6]
result = centered(data)
print(result)
`;

// Share links à la quiver: the Python source travels in the URL hash, so
// configurations can be shared as plain links with no server involved.
// #pyz= is deflate-compressed base64url; #py= is plain base64url, kept
// for browsers without CompressionStream.
function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function encodeShareHash(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(code);
  if (typeof CompressionStream === 'undefined') return `#py=${toBase64Url(bytes)}`;
  const packed = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return `#pyz=${toBase64Url(new Uint8Array(await new Response(packed).arrayBuffer()))}`;
}

async function decodeShareHash(hash: string): Promise<string | null> {
  const m = /^#(py|pyz)=([A-Za-z0-9\-_]+)$/.exec(hash);
  if (!m) return null;
  try {
    const bytes = fromBase64Url(m[2]);
    if (m[1] === 'py') return new TextDecoder().decode(bytes);
    const plain = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(plain).text();
  } catch {
    return null;
  }
}

/** One minimal text edit (common prefix/suffix trimmed). */
function minimalEdit(prev: string, current: string): { start: number; end: number; newText: string } | null {
  if (prev === current) return null;
  let s = 0;
  const max = Math.min(prev.length, current.length);
  while (s < max && prev[s] === current[s]) s++;
  let e1 = prev.length;
  let e2 = current.length;
  while (e1 > s && e2 > s && prev[e1 - 1] === current[e2 - 1]) {
    e1--;
    e2--;
  }
  return { start: s, end: e1, newText: current.slice(s, e2) };
}

export function PythonPlayground() {
  const { theme } = useTheme();
  const [pyCode, setPyCode] = useState(defaultPython);
  // The derived DOTS, as currently held by the editor. Unlike the Lean
  // playground this chain is FULLY bidirectional: every translatable canvas
  // edit writes back into the Python source through PythonLens.bwd, and
  // untranslatable ones are refused with the lens's reason.
  const [dotsCode, setDotsCode] = useState('');
  const [tab, setTab] = useState<'python' | 'dots'>('python');
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [splitPercent, setSplitPercent] = useState(38);
  const [isDragging, setIsDragging] = useState(false);
  const [deriveError, setDeriveError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  // Why the last canvas edit did not reach the Python source (auto-clears).
  const [editNotice, setEditNotice] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [gridOn, setGridOn] = useState(false);
  const [alertPortsOn, setAlertPortsOn] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  // Full-screen one pane by collapsing the other.
  const [collapsed, setCollapsed] = useState<'code' | 'diagram' | null>(null);
  // Python source line (1-based) of the first selected box, via the
  // coupling's correspondence (graph id → python span).
  const [selLine, setSelLine] = useState<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const dotsEditorRef = useRef<DotsEditorType | null>(null);
  const pyModRef = useRef<PythonModule | null>(null);
  const edModRef = useRef<EditorModule | null>(null);
  // The bidirectional chain: python text ↔ (hidden graph) ↔ dots text.
  const couplingRef = useRef<InstanceType<PythonModule['PythonDotsCoupling']> | null>(null);
  // The python text the coupling currently holds. pyCode === snapshot means
  // the chain is in sync (the edit came from the canvas, or no edit at all).
  const pySnapshotRef = useRef('');
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pyCodeRef = useRef(pyCode); // Keep latest code for theme changes
  // Grid on/off, held in a ref so it survives the editor re-init on theme change.
  const gridOnRef = useRef(false);
  // Same for the unconnected-port alert.
  const alertPortsOnRef = useRef(false);
  // Selection ids last seen, to scroll the Python pane only when the
  // selection actually changes.
  const lastSelIdsRef = useRef('');

  useEffect(() => {
    pyCodeRef.current = pyCode;
  }, [pyCode]);

  // A share link in the URL hash takes precedence over the default example.
  useEffect(() => {
    let cancelled = false;
    decodeShareHash(window.location.hash).then((shared) => {
      if (shared !== null && !cancelled) setPyCode(shared);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const shownCode = tab === 'python' ? pyCode : dotsCode;
  const lineCount = shownCode.split('\n').length;

  // Collect error diagnostics from the derived graph for the banner.
  const refreshDiagnostics = useCallback(() => {
    const diags = dotsEditorRef.current?.getDiagnostics() ?? [];
    setDiagnostics(diags.filter((d) => d.severity === 'error').map((d) => d.message));
  }, []);

  const showEditNotice = useCallback((reason: string) => {
    setEditNotice(reason);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setEditNotice(null), 5000);
  }, []);

  // Bring a Python source line into view in the code pane (top third), if needed.
  const scrollCodeToLine = useCallback((line: number) => {
    const pane = editorRef.current;
    if (!pane) return;
    const y = 16 + (line - 1) * 21; // editor padding + line height
    if (y < pane.scrollTop + 8 || y > pane.scrollTop + pane.clientHeight - 29) {
      pane.scrollTo({ top: Math.max(0, y - pane.clientHeight / 3), behavior: 'smooth' });
    }
  }, []);

  // Build the whole chain from Python source. Returns the dots.
  const rebuildChain = useCallback((pyText: string): string => {
    const pyMod = pyModRef.current!;
    couplingRef.current = pyMod.PythonDotsCoupling.fromPython(pyText);
    pySnapshotRef.current = pyText;
    return couplingRef.current.dotsText;
  }, []);

  // Fold the editor's current text (canvas-only state: positions, expansion)
  // into the coupling, as one reconciled dots edit. View attrs are invisible
  // to Python, so the python side must not move.
  const syncChainToEditor = useCallback(() => {
    const ed = dotsEditorRef.current;
    const coupling = couplingRef.current;
    const edMod = edModRef.current;
    if (!ed || !coupling || !edMod) return;
    const edit = minimalEdit(coupling.dotsText, ed.getDots());
    if (!edit) return;
    try {
      coupling.applyView(edMod.TextDelta.of(edit));
      pySnapshotRef.current = coupling.pyText;
    } catch {
      // Unreconcilable editor state: the chain stays on the fresh derivation.
    }
  }, []);

  // Initialize the editor (reinitialize on theme change): load the editor and
  // the wasm parser, register the Python domain, derive the program graph.
  useEffect(() => {
    if (!diagramRef.current) return;

    if (dotsEditorRef.current) {
      dotsEditorRef.current.dispose();
      dotsEditorRef.current = null;
    }

    let disposed = false;
    Promise.all([
      import('@adjointlabs/graph-editor/standalone'),
      import('@adjointlabs/graph-editor') as Promise<EditorModule>,
      import('@adjointlabs/sidecar-python/web') as Promise<PythonModule>,
    ]).then(async ([{ DotsEditor }, edMod, pyMod]) => {
      await pyMod.initPythonWeb({ treeSitterWasm: treeSitterWasmUrl, pythonWasm: pythonWasmUrl });
      if (disposed || !diagramRef.current) return;
      pyModRef.current = pyMod;
      edModRef.current = edMod;
      // The derived DOTS carries `domain = python`; registering the domain
      // lets loadFromDots apply the PL presentation and rules.
      edMod.registerDomain(pyMod.pythonDomain);

      dotsEditorRef.current = new DotsEditor(diagramRef.current, {
        theme: buildDiagramTheme(),
        grid: { enabled: gridOnRef.current },
        alertUnconnectedPorts: alertPortsOnRef.current,
        // The header toolbar carries fit/re-layout/undo/redo instead.
        toolbar: false,
        onViewportChange: (z) => setZoom(z),
        onSelectionChange: (sel: SelectedElementType[]) => {
          // Editor ids are its own (it re-parses the dots text), so bridge
          // through the shared DOTS text: editor id → its dots span →
          // pySpanAtDots (the innermost python-tracked enclosing node) → line.
          const coupling = couplingRef.current;
          const editor = dotsEditorRef.current?.editorView.editor;
          let line: number | null = null;
          if (coupling && editor) {
            for (const s of sel) {
              const dotsSpan = editor.spanOf(s.id);
              if (!dotsSpan) continue;
              const span = coupling.pySpanAtDots(dotsSpan);
              if (span) {
                line = coupling.pyText.slice(0, span.start).split('\n').length;
                break;
              }
            }
          }
          setSelLine(line);
          const ids = sel.map((s) => s.id).join(',');
          if (line !== null && ids !== lastSelIdsRef.current) scrollCodeToLine(line);
          lastSelIdsRef.current = ids;
        },
        onChange: (newDots) => {
          setDotsCode(newDots);
          refreshDiagnostics();
        },
        // The backward direction: run each canvas gesture through the
        // bidirectional chain BEFORE it commits. PythonLens.bwd validates
        // first (dots + python domain) — a translatable edit lands in the
        // Python source, an untranslatable one is refused with the reason.
        onEdits: (edits) => {
          const coupling = couplingRef.current;
          const edMod2 = edModRef.current;
          if (!coupling || !edMod2) return { ok: true };
          if (pyCodeRef.current !== pySnapshotRef.current) {
            showEditNotice('the Python source changed — waiting for the re-derivation');
            return { ok: false };
          }
          try {
            const dPy = coupling.applyView(edMod2.TextDelta.of(...edits));
            pySnapshotRef.current = coupling.pyText;
            if (!dPy.isEmpty) setPyCode(coupling.pyText);
            return { ok: true };
          } catch (e) {
            showEditNotice((e as Error).message);
            return { ok: false };
          }
        },
      });

      try {
        const dots = rebuildChain(pyCodeRef.current);
        setDotsCode(dots);
        dotsEditorRef.current.loadFromDots(dots);
        setDeriveError(null);
        refreshDiagnostics();
        syncChainToEditor();
      } catch (e) {
        setDeriveError((e as Error).message);
      }
    });

    return () => {
      disposed = true;
      dotsEditorRef.current?.dispose();
      dotsEditorRef.current = null;
    };
  }, [theme, refreshDiagnostics, rebuildChain, syncChainToEditor, showEditNotice, scrollCodeToLine]);

  // Propagate Python edits through the chain (with debounce), id-stably:
  // surviving statements keep their names, so boxes keep ids and positions.
  // Unparsable Python refuses pre-commit — the chain (and the canvas) stay
  // on the last good state until the source parses again.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const ed = dotsEditorRef.current;
      const edMod = edModRef.current;
      if (!ed || !edMod || !pyModRef.current) return;
      try {
        if (!couplingRef.current) {
          // Recover from a failed initial derivation (e.g. a bad share link).
          const dots = rebuildChain(pyCode);
          setDotsCode(dots);
          ed.loadFromDots(dots);
          setDeriveError(null);
          refreshDiagnostics();
          syncChainToEditor();
          return;
        }
        if (pyCode === pySnapshotRef.current) {
          // Canvas-born or reverted edit: the chain is in sync — any earlier
          // parse error no longer applies.
          setDeriveError(null);
          return;
        }
        const coupling = couplingRef.current;
        const edit = minimalEdit(pySnapshotRef.current, pyCode);
        if (!edit) return;
        const dDots = coupling.applySource(edMod.TextDelta.of(edit));
        pySnapshotRef.current = coupling.pyText;
        setDeriveError(null);
        if (!dDots.isEmpty) {
          setDotsCode(coupling.dotsText);
          // Incremental update: surviving boxes keep ids and positions.
          ed.applyExternalText(coupling.dotsText);
          refreshDiagnostics();
          syncChainToEditor();
        }
      } catch (e) {
        setDeriveError((e as Error).message);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [pyCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateCursorPosition = useCallback(() => {
    const textarea = editorRef.current?.querySelector('textarea');
    if (textarea) {
      const pos = textarea.selectionStart;
      const textBefore = pyCodeRef.current.substring(0, pos);
      const lines = textBefore.split('\n');
      setCursorPos({ line: lines.length, col: lines[lines.length - 1].length + 1 });
    }
  }, []);

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
    ed.setZoom(ed.getZoom() * Math.exp(-e.deltaY * 0.0015));
  }, []);

  const zoomPresets = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const handleUndo = useCallback(() => dotsEditorRef.current?.undo(), []);
  const handleRedo = useCallback(() => dotsEditorRef.current?.redo(), []);

  const handleToggleGrid = useCallback(() => {
    setGridOn((on) => {
      const next = !on;
      gridOnRef.current = next;
      dotsEditorRef.current?.setGrid({ enabled: next });
      return next;
    });
  }, []);

  // Ring every port no wire reaches.
  const handleToggleAlertPorts = useCallback(() => {
    setAlertPortsOn((on) => {
      const next = !on;
      alertPortsOnRef.current = next;
      dotsEditorRef.current?.setAlertUnconnectedPorts(next);
      return next;
    });
  }, []);

  const handleDownloadSvg = useCallback(() => {
    const svg = dotsEditorRef.current?.exportSvg({ theme: buildExportTheme(), background: false });
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'program-graph.svg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadTikz = useCallback(() => {
    const tikz = dotsEditorRef.current?.exportTikz({ theme: buildExportTheme(), background: false });
    if (!tikz) return;
    const blob = new Blob([tikz], { type: 'application/x-tex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'program-graph.tex';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadPng = useCallback(async () => {
    const blob = await dotsEditorRef.current?.exportPng({ theme: buildExportTheme(), background: false, scale: 2 });
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'program-graph.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  // Put the current Python source in the URL hash and copy the link.
  const handleShareLink = useCallback(async () => {
    const hash = await encodeShareHash(pyCodeRef.current);
    window.history.replaceState(null, '', `${window.location.pathname}?lang=python${hash}`);
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${window.location.pathname}?lang=python${hash}`,
      );
    } catch {
      // Clipboard unavailable — the address bar still holds the link.
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }, []);

  const handleRelayout = useCallback(() => {
    dotsEditorRef.current?.relayout();
  }, []);

  // Keyboard zoom: Cmd/Ctrl +/-/0 (in/out/fit).
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
    <div className="h-screen overflow-hidden bg-[--color-background] flex flex-col">
      {/* Accent line */}
      <div className="h-[3px] bg-[--color-accent] flex-shrink-0" />

      {/* Unified header with breadcrumb */}
      <header className="flex-shrink-0 border-b border-[--color-border] bg-[--color-surface]">
        <div className="px-4 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-lg">
            <Link
              to="/sidecar"
              className="text-[--color-text-secondary] hover:text-[--color-accent] transition-colors"
            >
              Sidecar
            </Link>
            <span className="text-[--color-text-muted]">/</span>
            <span className="font-medium text-[--color-text-primary]">Playground</span>
            <span
              className="ml-3 flex items-center gap-0.5 rounded-md border border-[--color-border] p-0.5 text-sm"
              role="group"
              aria-label="Playground language"
            >
              <Link
                to="/sidecar/playground"
                className="px-2 py-0.5 rounded text-[--color-text-secondary] hover:text-[--color-accent] transition-colors"
              >
                Lean
              </Link>
              <span
                aria-current="page"
                className="px-2 py-0.5 rounded font-medium text-[--color-text-primary] bg-[--color-background]"
              >
                Python
              </span>
            </span>
          </nav>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <div ref={containerRef} className="flex-1 flex min-h-0 relative">
        {/* Source panel */}
        <div
          className="flex flex-col"
          style={{
            width: collapsed === 'diagram' ? '100%' : `${splitPercent}%`,
            display: collapsed === 'code' ? 'none' : undefined,
          }}
        >
          <div className="px-4 py-2 border-b border-[--color-border] bg-[--color-surface] flex items-center justify-between h-10">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTab('python')}
                aria-pressed={tab === 'python'}
                className={`px-2 py-0.5 rounded text-sm font-medium transition-colors ${
                  tab === 'python'
                    ? 'text-[--color-text-primary] bg-[--color-background]'
                    : 'text-[--color-text-secondary] hover:text-[--color-accent]'
                }`}
              >
                Python
              </button>
              <button
                type="button"
                onClick={() => setTab('dots')}
                aria-pressed={tab === 'dots'}
                title="The DOTS derived from the Python source — canvas edits land here"
                className={`px-2 py-0.5 rounded text-sm font-medium transition-colors ${
                  tab === 'dots'
                    ? 'text-[--color-text-primary] bg-[--color-background]'
                    : 'text-[--color-text-secondary] hover:text-[--color-accent]'
                }`}
              >
                DOTS
                <span className="ml-1 text-[10px] uppercase tracking-wide text-[--color-text-muted]">derived</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCollapsed('code')}
              title="Hide source — full-width diagram"
              aria-label="Hide source"
              className="p-1 rounded text-[--color-text-secondary] hover:text-[--color-accent] hover:bg-[--color-background] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="flex-1 flex overflow-hidden">
            {/* Scrolls code and line numbers together, independent of the page */}
            <div
              ref={editorRef}
              className="flex-1 overflow-auto playground-scrollbar playground-nowrap"
              onClick={tab === 'python' ? updateCursorPosition : undefined}
              onKeyUp={tab === 'python' ? updateCursorPosition : undefined}
            >
              <div className="relative flex min-h-full w-max min-w-full">
                {/* Python line of the selected canvas box */}
                {tab === 'python' && selLine !== null && selLine <= lineCount && (
                  <div
                    aria-hidden
                    className="absolute left-0 right-0 pointer-events-none border-l-2 border-[--color-accent]"
                    style={{
                      top: 16 + (selLine - 1) * 21,
                      height: 21,
                      // Tailwind's /opacity modifier can't alpha a var() color
                      backgroundColor: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
                    }}
                  />
                )}
                {/* Line numbers */}
                <div
                  className="flex-shrink-0 py-4 px-3 text-right select-none border-r border-[--color-border] bg-[--color-surface] sticky left-0 z-10"
                  style={{ fontFamily: '"Source Code Pro", monospace', fontSize: 14, lineHeight: '21px' }}
                >
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i + 1} className="text-[--color-text-muted]">
                      {i + 1}
                    </div>
                  ))}
                </div>
                {/* Editor (Python) / read-only derived DOTS */}
                <div className="relative flex-1">
                  {tab === 'python' ? (
                    <Editor
                      value={pyCode}
                      onValueChange={(newCode) => {
                        setPyCode(newCode);
                        setTimeout(updateCursorPosition, 0);
                      }}
                      highlight={highlightPythonCode}
                      padding={16}
                      style={{
                        fontFamily: '"Source Code Pro", monospace',
                        fontSize: 14,
                        lineHeight: '21px',
                        minHeight: '100%',
                      }}
                      className="focus:outline-none"
                    />
                  ) : (
                    <pre
                      className="m-0"
                      style={{
                        fontFamily: '"Source Code Pro", monospace',
                        fontSize: 14,
                        lineHeight: '21px',
                        padding: 16,
                        minHeight: '100%',
                      }}
                      dangerouslySetInnerHTML={{ __html: highlightDotsCode(dotsCode) }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Status bar */}
          <div className="flex-shrink-0 px-4 py-1.5 border-t border-[--color-border] bg-[--color-surface] flex items-center justify-between text-xs text-[--color-text-muted]">
            <span>{tab === 'python' ? 'Python — two-way: canvas edits write back through the lens' : 'DOTS — derived, read-only here'}</span>
            {tab === 'python' && <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>}
          </div>
        </div>

        {/* Collapsed-source strip: reopen the source pane */}
        {collapsed === 'code' && (
          <button
            type="button"
            onClick={() => setCollapsed(null)}
            title="Show source"
            aria-label="Show source"
            className="flex-shrink-0 w-7 border-r border-[--color-border] bg-[--color-surface] flex items-start justify-center pt-2 text-[--color-text-secondary] hover:text-[--color-accent] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 5l7 7-7 7" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Resizable divider */}
        {collapsed === null && (
        <div
          onMouseDown={handleMouseDown}
          className="flex-shrink-0 cursor-col-resize group relative"
          style={{ width: '9px', marginLeft: '-4px', marginRight: '-4px' }}
        >
          <div className={`absolute top-0 bottom-0 w-px bg-[--color-border] group-hover:bg-[--color-text-muted] ${isDragging ? 'bg-[--color-accent]' : ''}`} style={{ left: '4px' }} />
        </div>
        )}

        {/* Program-graph panel */}
        <div
          className="flex flex-col"
          style={{
            width: collapsed === 'code' ? '100%' : `${100 - splitPercent}%`,
            display: collapsed === 'diagram' ? 'none' : undefined,
          }}
        >
          <div className="px-4 py-2 border-b border-[--color-border] bg-[--color-surface] flex items-center justify-between h-10">
            <span className="text-sm font-medium text-[--color-text-secondary]">Program graph</span>
            <div className="flex items-center gap-3 min-w-0">
              {editNotice ? (
                <span className="text-xs text-sky-500 truncate max-w-[260px]" title={editNotice}>
                  ⓘ {editNotice}
                </span>
              ) : null}
              {deriveError ? (
                <span className="text-xs text-red-500 truncate max-w-[200px]" title={deriveError}>
                  {deriveError}
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
                  onClick={handleToggleAlertPorts}
                  title={
                    alertPortsOn
                      ? 'Unconnected ports: highlighted'
                      : 'Highlight unconnected ports'
                  }
                  aria-label="Highlight unconnected ports"
                  aria-pressed={alertPortsOn}
                  className={`p-1 rounded transition-colors ${alertPortsOn ? 'text-[--color-accent] bg-[--color-background]' : 'text-[--color-text-secondary] hover:text-[--color-accent] hover:bg-[--color-background]'}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="3" />
                    <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={zoomToFit}
                  title="Fit to view"
                  aria-label="Fit to view"
                  className="p-1 rounded text-[--color-text-secondary] hover:text-[--color-accent] hover:bg-[--color-background] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleRelayout}
                  title="Re-layout (clears saved positions)"
                  aria-label="Re-layout"
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
                <button
                  type="button"
                  onClick={handleShareLink}
                  title={shareCopied ? 'Link copied!' : 'Copy share link (Python source encoded in URL)'}
                  aria-label="Copy share link"
                  className={`p-1 rounded transition-colors ${shareCopied ? 'text-[--color-accent] bg-[--color-background]' : 'text-[--color-text-secondary] hover:text-[--color-accent] hover:bg-[--color-background]'}`}
                >
                  {shareCopied ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 13.5a4 4 0 0 0 6 .4l3-3a4 4 0 0 0-5.7-5.7l-1.6 1.6" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5a4 4 0 0 0-6-.4l-3 3a4 4 0 0 0 5.7 5.7l1.6-1.6" />
                    </svg>
                  )}
                </button>
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
                  title="Undo canvas edit (Ctrl/Cmd+Z)"
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
                  title="Redo canvas edit (Ctrl/Cmd+Shift+Z)"
                  aria-label="Redo"
                  className="p-1 rounded text-[--color-text-secondary] hover:text-[--color-accent] hover:bg-[--color-background] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 14l5-5-5-5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 9H9a5 5 0 0 0 0 10h1" />
                  </svg>
                </button>
                <span className="w-px h-4 bg-[--color-border] mx-0.5" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setCollapsed('diagram')}
                  title="Hide diagram — full-width source"
                  aria-label="Hide diagram"
                  className="p-1 rounded text-[--color-text-secondary] hover:text-[--color-accent] hover:bg-[--color-background] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 5l7 7-7 7" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7" />
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
            <span>Python Program Graph</span>
          </div>
        </div>

        {/* Collapsed-diagram strip: reopen the diagram pane */}
        {collapsed === 'diagram' && (
          <button
            type="button"
            onClick={() => setCollapsed(null)}
            title="Show diagram"
            aria-label="Show diagram"
            className="flex-shrink-0 w-7 border-l border-[--color-border] bg-[--color-surface] flex items-start justify-center pt-2 text-[--color-text-secondary] hover:text-[--color-accent] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 19l-7-7 7-7" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
