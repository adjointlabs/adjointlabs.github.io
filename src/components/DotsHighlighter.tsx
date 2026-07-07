import React from 'react';

// Escape HTML special characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Returns HTML string for use with react-simple-code-editor
// Handles block comments across lines.
// `matchPair`, if given, is a pair of character offsets of two matching
// brackets to emphasize (bracket matching under the cursor).
export function highlightDotsCode(code: string, matchPair?: readonly [number, number] | null): string {
  let result = '';
  let remaining = code;
  let inBlockComment = false;
  const isMatch = (offset: number) =>
    !!matchPair && (offset === matchPair[0] || offset === matchPair[1]);

  while (remaining.length > 0) {
    // Block comment end (if inside block comment)
    if (inBlockComment) {
      const endMatch = remaining.match(/^([\s\S]*?\*\/)/);
      if (endMatch) {
        result += `<span style="color: var(--syntax-comment); font-style: italic">${escapeHtml(endMatch[1])}</span>`;
        remaining = remaining.slice(endMatch[1].length);
        inBlockComment = false;
        continue;
      } else {
        // Rest of code is inside comment
        result += `<span style="color: var(--syntax-comment); font-style: italic">${escapeHtml(remaining)}</span>`;
        break;
      }
    }

    // Block comment start
    const blockCommentMatch = remaining.match(/^(\/\*)/);
    if (blockCommentMatch) {
      result += `<span style="color: var(--syntax-comment); font-style: italic">${escapeHtml(blockCommentMatch[1])}</span>`;
      remaining = remaining.slice(blockCommentMatch[1].length);
      inBlockComment = true;
      continue;
    }

    // Line comments
    const lineCommentMatch = remaining.match(/^(\/\/[^\n]*)/);
    if (lineCommentMatch) {
      result += `<span style="color: var(--syntax-comment); font-style: italic">${escapeHtml(lineCommentMatch[1])}</span>`;
      remaining = remaining.slice(lineCommentMatch[1].length);
      continue;
    }

    // Strings (with escape sequences)
    const stringMatch = remaining.match(/^"([^"\\]|\\.)*"/);
    if (stringMatch) {
      result += `<span style="color: var(--syntax-string)">${escapeHtml(stringMatch[0])}</span>`;
      remaining = remaining.slice(stringMatch[0].length);
      continue;
    }

    // Type annotations (:: TypeName)
    const typeMatch = remaining.match(/^(::)\s*([A-Za-z_][A-Za-z0-9_]*)/);
    if (typeMatch) {
      result += `<span style="color: var(--syntax-operator)">${escapeHtml(typeMatch[1])}</span>`;
      result += ' ';
      result += `<span style="color: var(--syntax-type)">${escapeHtml(typeMatch[2])}</span>`;
      remaining = remaining.slice(typeMatch[0].length);
      continue;
    }

    // Port declarations: port [placement] name
    const portMatch = remaining.match(/^(port)\s+(left|right|top|bottom|topleft|topright|bottomleft|bottomright)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (portMatch) {
      result += `<span style="color: var(--syntax-keyword); font-weight: 500">${escapeHtml(portMatch[1])}</span>`;
      result += ' ';
      result += `<span style="color: var(--syntax-placement)">${escapeHtml(portMatch[2])}</span>`;
      result += ' ';
      result += `<span style="color: var(--syntax-port)">${escapeHtml(portMatch[3])}</span>`;
      remaining = remaining.slice(portMatch[0].length);
      continue;
    }

    // Port declarations without placement: port name
    const portSimpleMatch = remaining.match(/^(port)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (portSimpleMatch) {
      result += `<span style="color: var(--syntax-keyword); font-weight: 500">${escapeHtml(portSimpleMatch[1])}</span>`;
      result += ' ';
      result += `<span style="color: var(--syntax-port)">${escapeHtml(portSimpleMatch[2])}</span>`;
      remaining = remaining.slice(portSimpleMatch[0].length);
      continue;
    }

    // Keywords
    const keywordMatch = remaining.match(/^(graph|port)\b/);
    if (keywordMatch) {
      result += `<span style="color: var(--syntax-keyword); font-weight: 500">${escapeHtml(keywordMatch[1])}</span>`;
      remaining = remaining.slice(keywordMatch[1].length);
      continue;
    }

    // Arrows
    const arrowMatch = remaining.match(/^(->|--)/);
    if (arrowMatch) {
      result += `<span style="color: var(--syntax-operator)">${escapeHtml(arrowMatch[1])}</span>`;
      remaining = remaining.slice(arrowMatch[1].length);
      continue;
    }

    // Attribute names (before =)
    const attrMatch = remaining.match(/^(label|pos|expanded|name|return_wire)(?=\s*=)/);
    if (attrMatch) {
      result += `<span style="color: var(--syntax-attribute)">${escapeHtml(attrMatch[1])}</span>`;
      remaining = remaining.slice(attrMatch[1].length);
      continue;
    }

    // Position values (after =)
    const posValueMatch = remaining.match(/^(?<==\s*)(left|right|top|bottom)\b/);
    if (posValueMatch) {
      result += `<span style="color: var(--syntax-constant)">${escapeHtml(posValueMatch[1])}</span>`;
      remaining = remaining.slice(posValueMatch[1].length);
      continue;
    }

    // Edge endpoints (dotted paths: id.id.port)
    const edgeMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(\.[a-zA-Z_][a-zA-Z0-9_]*)+/);
    if (edgeMatch) {
      result += `<span style="color: var(--syntax-endpoint)">${escapeHtml(edgeMatch[0])}</span>`;
      remaining = remaining.slice(edgeMatch[0].length);
      continue;
    }

    // Boolean constants
    const boolMatch = remaining.match(/^(true|false)\b/);
    if (boolMatch) {
      result += `<span style="color: var(--syntax-constant)">${escapeHtml(boolMatch[1])}</span>`;
      remaining = remaining.slice(boolMatch[1].length);
      continue;
    }

    // Numbers
    const numMatch = remaining.match(/^-?\d+(\.\d+)?/);
    if (numMatch) {
      result += `<span style="color: var(--syntax-number)">${escapeHtml(numMatch[0])}</span>`;
      remaining = remaining.slice(numMatch[0].length);
      continue;
    }

    // Identifiers
    const idMatch = remaining.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    if (idMatch) {
      result += `<span style="color: var(--color-text-primary)">${escapeHtml(idMatch[1])}</span>`;
      remaining = remaining.slice(idMatch[1].length);
      continue;
    }

    // Default: single character (including newlines)
    {
      const offset = code.length - remaining.length;
      const ch = escapeHtml(remaining[0]);
      result += isMatch(offset)
        ? `<span class="bracket-match">${ch}</span>`
        : ch;
    }
    remaining = remaining.slice(1);
  }

  return result;
}

interface DotsHighlighterProps {
  code: string;
  bare?: boolean;
}

export function DotsHighlighter({ code, bare = false }: DotsHighlighterProps) {
  // Tokenize entire code (handles block comments across lines)
  const tokenize = (code: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let remaining = code;
    let key = 0;
    let inBlockComment = false;

    while (remaining.length > 0) {
      // Block comment end (if inside block comment)
      if (inBlockComment) {
        const endMatch = remaining.match(/^([\s\S]*?\*\/)/);
        if (endMatch) {
          tokens.push(<span key={key++} className="italic" style={{ color: 'var(--syntax-comment)' }}>{endMatch[1]}</span>);
          remaining = remaining.slice(endMatch[1].length);
          inBlockComment = false;
          continue;
        } else {
          tokens.push(<span key={key++} className="italic" style={{ color: 'var(--syntax-comment)' }}>{remaining}</span>);
          break;
        }
      }

      // Block comment start
      const blockCommentMatch = remaining.match(/^(\/\*)/);
      if (blockCommentMatch) {
        tokens.push(<span key={key++} className="italic" style={{ color: 'var(--syntax-comment)' }}>{blockCommentMatch[1]}</span>);
        remaining = remaining.slice(blockCommentMatch[1].length);
        inBlockComment = true;
        continue;
      }

      // Line comments
      const lineCommentMatch = remaining.match(/^(\/\/[^\n]*)/);
      if (lineCommentMatch) {
        tokens.push(<span key={key++} className="italic" style={{ color: 'var(--syntax-comment)' }}>{lineCommentMatch[1]}</span>);
        remaining = remaining.slice(lineCommentMatch[1].length);
        continue;
      }

      // Strings (with escape sequences)
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

      // Port declarations: port placement name
      const portMatch = remaining.match(/^(port)\s+(left|right|top|bottom|topleft|topright|bottomleft|bottomright)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (portMatch) {
        tokens.push(<span key={key++} className="font-medium" style={{ color: 'var(--syntax-keyword)' }}>{portMatch[1]}</span>);
        tokens.push(<span key={key++}> </span>);
        tokens.push(<span key={key++} style={{ color: 'var(--syntax-placement)' }}>{portMatch[2]}</span>);
        tokens.push(<span key={key++}> </span>);
        tokens.push(<span key={key++} style={{ color: 'var(--syntax-port)' }}>{portMatch[3]}</span>);
        remaining = remaining.slice(portMatch[0].length);
        continue;
      }

      // Port declarations without placement: port name
      const portSimpleMatch = remaining.match(/^(port)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (portSimpleMatch) {
        tokens.push(<span key={key++} className="font-medium" style={{ color: 'var(--syntax-keyword)' }}>{portSimpleMatch[1]}</span>);
        tokens.push(<span key={key++}> </span>);
        tokens.push(<span key={key++} style={{ color: 'var(--syntax-port)' }}>{portSimpleMatch[2]}</span>);
        remaining = remaining.slice(portSimpleMatch[0].length);
        continue;
      }

      // Keywords
      const keywordMatch = remaining.match(/^(graph|port)\b/);
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
      const attrMatch = remaining.match(/^(label|pos|expanded|name|return_wire)(?=\s*=)/);
      if (attrMatch) {
        tokens.push(<span key={key++} style={{ color: 'var(--syntax-attribute)' }}>{attrMatch[1]}</span>);
        remaining = remaining.slice(attrMatch[1].length);
        continue;
      }

      // Position values (after =)
      const posValueMatch = remaining.match(/^(?<==\s*)(left|right|top|bottom)\b/);
      if (posValueMatch) {
        tokens.push(<span key={key++} style={{ color: 'var(--syntax-constant)' }}>{posValueMatch[1]}</span>);
        remaining = remaining.slice(posValueMatch[1].length);
        continue;
      }

      // Edge endpoints (dotted paths: id.id.port)
      const edgeMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(\.[a-zA-Z_][a-zA-Z0-9_]*)+/);
      if (edgeMatch) {
        tokens.push(<span key={key++} style={{ color: 'var(--syntax-endpoint)' }}>{edgeMatch[0]}</span>);
        remaining = remaining.slice(edgeMatch[0].length);
        continue;
      }

      // Boolean constants
      const boolMatch = remaining.match(/^(true|false)\b/);
      if (boolMatch) {
        tokens.push(<span key={key++} style={{ color: 'var(--syntax-constant)' }}>{boolMatch[1]}</span>);
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

      // Identifiers
      const idMatch = remaining.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
      if (idMatch) {
        tokens.push(<span key={key++} className="text-[--color-text-primary]">{idMatch[1]}</span>);
        remaining = remaining.slice(idMatch[1].length);
        continue;
      }

      // Default: single character (including newlines)
      tokens.push(<span key={key++}>{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }

    return tokens;
  };

  return (
    <pre className={bare ? "" : "bg-[--color-surface] border border-[--color-border] rounded-lg p-4 overflow-x-auto"}>
      <code className="text-sm font-mono">
        {tokenize(code)}
      </code>
    </pre>
  );
}
