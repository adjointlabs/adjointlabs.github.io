// Escape HTML special characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Statement/structure keywords, colored like Lean's declaration headers.
const DECL_KEYWORDS = new Set([
  'def', 'class', 'import', 'from', 'as', 'global', 'nonlocal', 'lambda',
  'async', 'await', 'with', 'return', 'yield', 'pass', 'break', 'continue',
  'raise', 'try', 'except', 'finally', 'assert', 'del',
]);

// Flow/operator keywords, colored like DOTS operators.
const FLOW_KEYWORDS = new Set([
  'if', 'elif', 'else', 'for', 'while', 'in', 'is', 'not', 'and', 'or', 'match', 'case',
]);

const CONSTANTS = new Set(['True', 'False', 'None']);

function span(color: string, text: string, extra = ''): string {
  return `<span style="color: var(${color})${extra}">${escapeHtml(text)}</span>`;
}

// Returns HTML string for use with react-simple-code-editor.
// Handles comments, single/triple-quoted strings (f/r/b prefixes), keywords,
// the defined name after def/class, and numbers.
export function highlightPythonCode(code: string): string {
  let result = '';
  let i = 0;

  while (i < code.length) {
    const rest = code.slice(i);

    // Line comment
    const comment = rest.match(/^#[^\n]*/);
    if (comment) {
      result += span('--syntax-comment', comment[0], '; font-style: italic');
      i += comment[0].length;
      continue;
    }

    // Strings: optional prefix, then triple- or single-quoted.
    const str = rest.match(
      /^(?:[rRbBuUfF]{0,2})(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:[^"\\\n]|\\.)*(?:"|$)|'(?:[^'\\\n]|\\.)*(?:'|$))/,
    );
    if (str) {
      result += span('--syntax-string', str[0]);
      i += str[0].length;
      continue;
    }

    // Identifiers / keywords
    const word = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (word) {
      const w = word[0];
      if (CONSTANTS.has(w)) {
        result += span('--syntax-constant', w, '; font-weight: 500');
      } else if (DECL_KEYWORDS.has(w)) {
        result += span('--syntax-keyword', w, '; font-weight: 500');
        // The defined name after def/class.
        const name = rest.slice(w.length).match(/^(\s+)([A-Za-z_][A-Za-z0-9_]*)/);
        if (name && (w === 'def' || w === 'class')) {
          result += name[1] + span('--syntax-type', name[2]);
          i += name[0].length;
        }
      } else if (FLOW_KEYWORDS.has(w)) {
        result += span('--syntax-operator', w);
      } else {
        result += escapeHtml(w);
      }
      i += w.length;
      continue;
    }

    // Numbers (ints, floats, hex/bin/oct, exponents)
    const num = rest.match(/^\d(?:[\d_.]|[eE][+-]?|[xXoObB])*[jJ]?/);
    if (num) {
      result += span('--syntax-number', num[0]);
      i += num[0].length;
      continue;
    }

    // Plain run up to the next character that could start a token above.
    const plain = rest.match(/^[^A-Za-z_0-9"'#]+/);
    if (plain) {
      result += escapeHtml(plain[0]);
      i += plain[0].length;
      continue;
    }

    result += escapeHtml(code[i]);
    i += 1;
  }

  return result;
}
