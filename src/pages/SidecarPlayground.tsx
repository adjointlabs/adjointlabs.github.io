import { Link } from 'react-router-dom';
import { useState, useRef, useCallback, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import { highlightLeanCode } from '../components/LeanHighlighter';
import { highlightDotsCode } from '../components/DotsHighlighter';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { buildDiagramTheme, buildExportTheme } from '../components/diagramTheme';

// Dynamically imported: the standalone graph-editor, its core (domain
// registry), and the Lean lens. All three resolve the same graph-editor
// module instance, so the registered domain is the one the editor sees.
type DotsEditorType = import('@adjointlabs/graph-editor/standalone').DotsEditor;
type SelectedElementType = import('@adjointlabs/graph-editor/standalone').SelectedElement;
type EditorModule = typeof import('@adjointlabs/graph-editor');
type LeanModule = typeof import('@adjointlabs/sidecar-lean');

const defaultLean = `import Mathlib

/-!
# Infinitely many primes of the form 4k + 3

Euclid's argument, adapted to one residue class. Given \`n\`, the number
\`N = 4 · n! − 1\` is \`3 mod 4\`. Every such number has a prime factor
\`p ≡ 3 (mod 4)\` (a descent argument), and no prime \`≤ n\` divides \`N\`
(Euclid's step). So \`p > n\`, and the primes \`≡ 3 (mod 4)\` are unbounded.
-/

namespace Demo

/-- Descent: every \`n ≡ 3 (mod 4)\` has a prime factor \`p ≡ 3 (mod 4)\`. -/
lemma exists_prime_factor_three_mod_four (n : ℕ) (hn : n % 4 = 3) :
    ∃ p, p.Prime ∧ p ∣ n ∧ p % 4 = 3 := by
  induction n using Nat.strong_induction_on with
  | _ n ih =>
  have hn1 : n ≠ 1 := by omega
  obtain ⟨p, hp, hpn⟩ := Nat.exists_prime_and_dvd hn1
  by_cases h3 : p % 4 = 3
  · exact ⟨p, hp, hpn, h3⟩
  · obtain ⟨m, hm⟩ := hpn
    have hp1 : p % 4 = 1 := by
      rcases hp.eq_two_or_odd with rfl | hodd <;> omega
    have hm3 : m % 4 = 3 := by
      have hmul := Nat.mul_mod p m 4
      rw [← hm, hp1, one_mul, Nat.mod_mod] at hmul
      omega
    have hm_lt : m < n := by
      have hm_pos : 0 < m := Nat.pos_of_ne_zero (by rintro rfl; omega)
      rw [hm]
      exact (Nat.lt_mul_iff_one_lt_left hm_pos).mpr hp.one_lt
    obtain ⟨q, hq, hqm, hq3⟩ := ih m hm_lt hm3
    exact ⟨q, hq, dvd_trans hqm (hm ▸ dvd_mul_left m p), hq3⟩

/-- Euclid's step: a prime factor of \`4 · n! − 1\` is larger than \`n\`. -/
lemma lt_of_prime_dvd_four_factorial_sub_one {n p : ℕ} (hp : p.Prime)
    (hpN : p ∣ 4 * n.factorial - 1) : n < p := by
  by_contra! hle
  have hfac : 0 < n.factorial := Nat.factorial_pos n
  have h1 : p ∣ n.factorial := Nat.dvd_factorial hp.pos hle
  have h2 : p ∣ 4 * n.factorial := Dvd.dvd.mul_left h1 4
  have h3 : 4 * n.factorial = (4 * n.factorial - 1) + 1 := by omega
  have h4 : p ∣ 1 := by
    rw [h3] at h2
    exact (Nat.dvd_add_right hpN).mp h2
  exact hp.not_dvd_one h4

/-- Main theorem: for every \`n\` there is a prime \`p > n\` with \`p ≡ 3 (mod 4)\`. -/
theorem exists_prime_three_mod_four_gt (n : ℕ) :
    ∃ p, n < p ∧ p.Prime ∧ p % 4 = 3 := by
  have hfac : 0 < n.factorial := Nat.factorial_pos n
  have hN3 : (4 * n.factorial - 1) % 4 = 3 := by omega
  obtain ⟨p, hp, hpN, hp3⟩ := exists_prime_factor_three_mod_four _ hN3
  have hnp : n < p := lt_of_prime_dvd_four_factorial_sub_one hp hpN
  exact ⟨p, hnp, hp, hp3⟩

/-- Corollary: there are infinitely many primes \`p ≡ 3 (mod 4)\`. -/
theorem infinite_setOf_prime_three_mod_four :
    {p : ℕ | p.Prime ∧ p % 4 = 3}.Infinite := by
  refine Set.infinite_of_not_bddAbove ?_
  rintro ⟨n, hn⟩
  obtain ⟨p, hnp, hp, hp3⟩ := exists_prime_three_mod_four_gt n
  have hpn : p ≤ n := hn ⟨hp, hp3⟩
  omega

end Demo
`;

// Share links à la quiver: the Lean source travels in the URL hash, so
// configurations can be shared as plain links with no server involved.
// #leanz= is deflate-compressed base64url; #lean= is plain base64url, kept
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
  if (typeof CompressionStream === 'undefined') return `#lean=${toBase64Url(bytes)}`;
  const packed = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return `#leanz=${toBase64Url(new Uint8Array(await new Response(packed).arrayBuffer()))}`;
}

async function decodeShareHash(hash: string): Promise<string | null> {
  const m = /^#(lean|leanz)=([A-Za-z0-9\-_]+)$/.exec(hash);
  if (!m) return null;
  try {
    const bytes = fromBase64Url(m[2]);
    if (m[1] === 'lean') return new TextDecoder().decode(bytes);
    const plain = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(plain).text();
  } catch {
    return null;
  }
}

export function SidecarPlayground() {
  const { theme } = useTheme();
  const [leanCode, setLeanCode] = useState(defaultLean);
  // The derived DOTS, as currently held by the editor (canvas edits land
  // here — never back in the Lean source; the Lean lens is one-way for now).
  const [dotsCode, setDotsCode] = useState('');
  const [tab, setTab] = useState<'lean' | 'dots'>('lean');
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [splitPercent, setSplitPercent] = useState(38);
  const [isDragging, setIsDragging] = useState(false);
  const [deriveError, setDeriveError] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [zoomMenuOpen, setZoomMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [gridOn, setGridOn] = useState(false);
  const [alertPortsOn, setAlertPortsOn] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  // Full-screen one pane by collapsing the other.
  const [collapsed, setCollapsed] = useState<'code' | 'diagram' | null>(null);
  // Lean source line (1-based) of the first selected box, from its `line` attr.
  const [selLine, setSelLine] = useState<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const dotsEditorRef = useRef<DotsEditorType | null>(null);
  const leanModRef = useRef<LeanModule | null>(null);
  const leanCodeRef = useRef(leanCode); // Keep latest code for theme changes
  // The DOTS text of the last successful derivation. An unchanged derivation
  // (e.g. a comment edit in the Lean) keeps canvas state, extension-style.
  const lastDerivedRef = useRef<string | null>(null);
  // Grid on/off, held in a ref so it survives the editor re-init on theme change.
  const gridOnRef = useRef(false);
  // Same for the unconnected-port alert.
  const alertPortsOnRef = useRef(false);
  // Selection ids last seen, to scroll the Lean pane only when the selection
  // actually changes.
  const lastSelIdsRef = useRef('');

  useEffect(() => {
    leanCodeRef.current = leanCode;
  }, [leanCode]);

  // A share link in the URL hash takes precedence over the default example.
  useEffect(() => {
    let cancelled = false;
    decodeShareHash(window.location.hash).then((shared) => {
      if (shared !== null && !cancelled) setLeanCode(shared);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const shownCode = tab === 'lean' ? leanCode : dotsCode;
  const lineCount = shownCode.split('\n').length;

  // Collect error-severity diagnostics from the derived graph.
  const refreshDiagnostics = useCallback(() => {
    const diags = dotsEditorRef.current?.getDiagnostics() ?? [];
    setDiagnostics(diags.filter((d) => d.severity === 'error').map((d) => d.message));
  }, []);

  // Bring a Lean source line into view in the code pane (top third), if needed.
  const scrollCodeToLine = useCallback((line: number) => {
    const pane = editorRef.current;
    if (!pane) return;
    const y = 16 + (line - 1) * 21; // editor padding + line height
    if (y < pane.scrollTop + 8 || y > pane.scrollTop + pane.clientHeight - 29) {
      pane.scrollTo({ top: Math.max(0, y - pane.clientHeight / 3), behavior: 'smooth' });
    }
  }, []);

  // Initialize the editor (reinitialize on theme change): load the editor,
  // register the Lean proof domain, derive the proof graph from the source.
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
      import('@adjointlabs/sidecar-lean') as Promise<LeanModule>,
    ]).then(([{ DotsEditor }, edMod, leanMod]) => {
      if (disposed || !diagramRef.current) return;
      leanModRef.current = leanMod;
      // The derived DOTS carries `domain = lean`; registering the domain lets
      // loadFromDots apply the proof-graph presentation and rules.
      edMod.registerDomain(leanMod.leanDomain);

      // Lean line of a selected element, from the box's `line` attr.
      const lineOf = (id: SelectedElementType['id']): number | null => {
        const view = dotsEditorRef.current?.editorView.editor.view;
        const el = view?.lookup(id);
        if (el instanceof edMod.Graph) {
          const line = edMod.effectiveAttributes(el).get('line');
          if (line && /^\d+$/.test(line)) return parseInt(line, 10);
        }
        return null;
      };

      dotsEditorRef.current = new DotsEditor(diagramRef.current, {
        theme: buildDiagramTheme(),
        grid: { enabled: gridOnRef.current },
        alertUnconnectedPorts: alertPortsOnRef.current,
        // The header toolbar carries fit/re-layout/undo/redo instead.
        toolbar: false,
        onViewportChange: (z) => setZoom(z),
        onSelectionChange: (sel) => {
          const line = sel.map((s) => lineOf(s.id)).find((l) => l !== null) ?? null;
          setSelLine(line);
          const ids = sel.map((s) => s.id).join(',');
          if (line !== null && ids !== lastSelIdsRef.current) scrollCodeToLine(line);
          lastSelIdsRef.current = ids;
        },
        onChange: (newDots) => {
          // Canvas edits land in the derived DOTS (shown in the DOTS tab),
          // never back in the Lean source: the lens is one-way for now.
          setDotsCode(newDots);
          refreshDiagnostics();
        },
      });

      try {
        const dots = leanMod.deriveDots(leanCodeRef.current);
        lastDerivedRef.current = dots;
        setDotsCode(dots);
        dotsEditorRef.current.loadFromDots(dots);
        setDeriveError(null);
        refreshDiagnostics();
      } catch (e) {
        setDeriveError((e as Error).message);
      }
    });

    return () => {
      disposed = true;
      dotsEditorRef.current?.dispose();
      dotsEditorRef.current = null;
    };
  }, [theme, refreshDiagnostics, scrollCodeToLine]);

  // Re-derive when the Lean source changes (with debounce). An unchanged
  // derivation keeps canvas state (positions, selection, canvas-only edits);
  // a changed one resets the graph to the fresh derivation.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const ed = dotsEditorRef.current;
      const leanMod = leanModRef.current;
      if (!ed || !leanMod) return;
      try {
        const dots = leanMod.deriveDots(leanCode);
        setDeriveError(null);
        if (dots === lastDerivedRef.current) return;
        lastDerivedRef.current = dots;
        setDotsCode(dots);
        // Incremental update: surviving boxes keep ids and positions.
        ed.applyExternalText(dots);
        refreshDiagnostics();
      } catch (e) {
        setDeriveError((e as Error).message);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [leanCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateCursorPosition = useCallback(() => {
    const textarea = editorRef.current?.querySelector('textarea');
    if (textarea) {
      const pos = textarea.selectionStart;
      const textBefore = leanCodeRef.current.substring(0, pos);
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

  // Ring every port no wire reaches — in a proof graph, a hypothesis
  // nothing established (or a conclusion nothing uses).
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
    a.download = 'proof-graph.svg';
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
    a.download = 'proof-graph.tex';
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
    a.download = 'proof-graph.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  // Put the current Lean source in the URL hash and copy the link.
  const handleShareLink = useCallback(async () => {
    const hash = await encodeShareHash(leanCodeRef.current);
    window.history.replaceState(null, '', hash);
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${window.location.pathname}${hash}`,
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
                onClick={() => setTab('lean')}
                aria-pressed={tab === 'lean'}
                className={`px-2 py-0.5 rounded text-sm font-medium transition-colors ${
                  tab === 'lean'
                    ? 'text-[--color-text-primary] bg-[--color-background]'
                    : 'text-[--color-text-secondary] hover:text-[--color-accent]'
                }`}
              >
                Lean
              </button>
              <button
                type="button"
                onClick={() => setTab('dots')}
                aria-pressed={tab === 'dots'}
                title="The DOTS derived from the Lean source — canvas edits land here"
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
              onClick={tab === 'lean' ? updateCursorPosition : undefined}
              onKeyUp={tab === 'lean' ? updateCursorPosition : undefined}
            >
              <div className="relative flex min-h-full w-max min-w-full">
                {/* Lean line of the selected canvas box */}
                {tab === 'lean' && selLine !== null && selLine <= lineCount && (
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
                {/* Editor (Lean) / read-only derived DOTS */}
                <div className="relative flex-1">
                  {tab === 'lean' ? (
                    <Editor
                      value={leanCode}
                      onValueChange={(newCode) => {
                        setLeanCode(newCode);
                        setTimeout(updateCursorPosition, 0);
                      }}
                      highlight={highlightLeanCode}
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
            <span>{tab === 'lean' ? 'Lean — one-way: source → graph' : 'DOTS — derived, read-only here'}</span>
            {tab === 'lean' && <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>}
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

        {/* Proof-graph panel */}
        <div
          className="flex flex-col"
          style={{
            width: collapsed === 'code' ? '100%' : `${100 - splitPercent}%`,
            display: collapsed === 'diagram' ? 'none' : undefined,
          }}
        >
          <div className="px-4 py-2 border-b border-[--color-border] bg-[--color-surface] flex items-center justify-between h-10">
            <span className="text-sm font-medium text-[--color-text-secondary]">Proof graph</span>
            <div className="flex items-center gap-3 min-w-0">
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
                      : 'Highlight unconnected ports (hypotheses nothing establishes)'
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
                  title={shareCopied ? 'Link copied!' : 'Copy share link (Lean source encoded in URL)'}
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
            <span>Lean Proof Graph</span>
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
