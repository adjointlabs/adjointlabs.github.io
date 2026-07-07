// A small, self-contained graph-editor diagram for embedding rendered DOTS
// examples (e.g. on the /dots reference page) with the same canvas style as
// the playground. Pass `bgVar` to match the surrounding container's color.

import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { buildDiagramTheme } from './diagramTheme';

type DotsEditorType = import('@adjointlabs/graph-editor/standalone').DotsEditor;

interface DotsDiagramProps {
  code: string;
  /** CSS variable for the canvas background (default the page background).
   * Use `--color-surface` to blend into a card. */
  bgVar?: string;
  className?: string;
  /** Allow pan/zoom/drag/context-menu. Defaults to false: a static render. */
  interactive?: boolean;
}

export function DotsDiagram({ code, bgVar, className, interactive = false }: DotsDiagramProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<DotsEditorType | null>(null);

  // Reinitialize on theme change (the canvas theme is derived from the active
  // light/dark CSS variables) or when the source/background changes.
  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;

    import('@adjointlabs/graph-editor/standalone').then(({ DotsEditor }) => {
      if (disposed || !containerRef.current) return;
      editorRef.current?.dispose();
      editorRef.current = new DotsEditor(containerRef.current, {
        theme: buildDiagramTheme(bgVar),
      });
      try {
        editorRef.current.loadFromDots(code);
      } catch {
        // Malformed example: leave the canvas empty rather than throwing.
      }
    });

    return () => {
      disposed = true;
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, [theme, code, bgVar]);

  return (
    <div
      ref={containerRef}
      className={className}
      // A static render blocks pointer interaction (drag/zoom/context menu);
      // the diagram still renders and auto-fits.
      style={interactive ? undefined : { pointerEvents: 'none' }}
    />
  );
}
