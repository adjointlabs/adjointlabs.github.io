import React from 'react';

interface DotsHighlighterProps {
  code: string;
  bare?: boolean;
}

export function DotsHighlighter({ code, bare = false }: DotsHighlighterProps) {
  const highlightLine = (line: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;

    while (remaining.length > 0) {
      // Comments
      const commentMatch = remaining.match(/^(\/\/.*)$/);
      if (commentMatch) {
        tokens.push(<span key={key++} className="italic" style={{ color: 'var(--syntax-comment)' }}>{commentMatch[1]}</span>);
        remaining = remaining.slice(commentMatch[1].length);
        continue;
      }

      // Strings
      const stringMatch = remaining.match(/^"([^"\\]|\\.)*"/);
      if (stringMatch) {
        tokens.push(<span key={key++} style={{ color: 'var(--syntax-string)' }}>{stringMatch[0]}</span>);
        remaining = remaining.slice(stringMatch[0].length);
        continue;
      }

      // Type annotations (:: TypeName)
      const typeMatch = remaining.match(/^(::)\s*([A-Za-z_][A-Za-z0-9_]*)/);
      if (typeMatch) {
        tokens.push(<span key={key++} style={{ color: 'var(--syntax-operator)' }}>{typeMatch[1]}</span>);
        tokens.push(<span key={key++}> </span>);
        tokens.push(<span key={key++} style={{ color: 'var(--syntax-type)' }}>{typeMatch[2]}</span>);
        remaining = remaining.slice(typeMatch[0].length);
        continue;
      }

      // Keywords
      const keywordMatch = remaining.match(/^(graph|subgraph|port)\b/);
      if (keywordMatch) {
        tokens.push(<span key={key++} className="font-medium" style={{ color: 'var(--syntax-keyword)' }}>{keywordMatch[1]}</span>);
        remaining = remaining.slice(keywordMatch[1].length);
        continue;
      }

      // Arrows
      const arrowMatch = remaining.match(/^(->|--)/);
      if (arrowMatch) {
        tokens.push(<span key={key++} style={{ color: 'var(--syntax-operator)' }}>{arrowMatch[1]}</span>);
        remaining = remaining.slice(arrowMatch[1].length);
        continue;
      }

      // Attribute names (before =)
      const attrMatch = remaining.match(/^(label|pos|expanded|name|return_wire|dir)(?=\s*=)/);
      if (attrMatch) {
        tokens.push(<span key={key++} style={{ color: 'var(--syntax-attribute)' }}>{attrMatch[1]}</span>);
        remaining = remaining.slice(attrMatch[1].length);
        continue;
      }

      // Edge endpoints (dotted paths)
      const edgeMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(\.[a-zA-Z_][a-zA-Z0-9_]*)+/);
      if (edgeMatch) {
        tokens.push(<span key={key++} style={{ color: 'var(--syntax-endpoint)' }}>{edgeMatch[0]}</span>);
        remaining = remaining.slice(edgeMatch[0].length);
        continue;
      }

      // Boolean constants
      const boolMatch = remaining.match(/^(true|false)\b/);
      if (boolMatch) {
        tokens.push(<span key={key++} style={{ color: 'var(--syntax-number)' }}>{boolMatch[1]}</span>);
        remaining = remaining.slice(boolMatch[1].length);
        continue;
      }

      // Numbers
      const numMatch = remaining.match(/^-?\d+(\.\d+)?/);
      if (numMatch) {
        tokens.push(<span key={key++} style={{ color: 'var(--syntax-number)' }}>{numMatch[0]}</span>);
        remaining = remaining.slice(numMatch[0].length);
        continue;
      }

      // Identifiers (node names at start of content or after newline/whitespace)
      const idMatch = remaining.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
      if (idMatch) {
        tokens.push(<span key={key++} className="text-[--color-text-primary]">{idMatch[1]}</span>);
        remaining = remaining.slice(idMatch[1].length);
        continue;
      }

      // Default: single character
      tokens.push(<span key={key++}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }

    return tokens;
  };

  const lines = code.split('\n');

  return (
    <pre className={bare ? "" : "bg-[--color-surface] border border-[--color-border] rounded-lg p-4 overflow-x-auto"}>
      <code className="text-sm font-mono">
        {lines.map((line, i) => (
          <React.Fragment key={i}>
            {highlightLine(line)}
            {i < lines.length - 1 && '\n'}
          </React.Fragment>
        ))}
      </code>
    </pre>
  );
}
