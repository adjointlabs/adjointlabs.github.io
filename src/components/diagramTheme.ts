// Shared canvas theme for the graph-editor, derived from the site's
// --color-* CSS variables (defined per light/dark in index.css). Used by both
// the playground and the /dots page so their diagrams look identical.
//
// graph-editor renders to <canvas>, so it needs concrete colors, not CSS vars.
// The diagram's `background` is configurable: the playground uses the page
// background, while an embedded doc example passes the surrounding card's
// surface color so the canvas blends into the card.

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

/**
 * Build the canvas theme. Call after the active light/dark class is applied,
 * so it reflects the current theme. `bgVar` names the CSS variable used for the
 * diagram background (default the page background; pass `--color-surface` to
 * blend into a doc card).
 */
export function buildDiagramTheme(bgVar: string = '--color-background'): DiagramTheme {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  const primary = v('--color-text-primary', '#0f172a');
  const secondary = v('--color-text-secondary', '#475569');
  const muted = v('--color-text-muted', '#94a3b8');
  const accent = v('--color-accent', '#3b82f6');
  const background = v(bgVar, '#fafafa');
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
