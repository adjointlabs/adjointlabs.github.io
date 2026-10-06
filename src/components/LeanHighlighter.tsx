// Escape HTML special characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Declaration headers: the keyword is followed by the declared name.
const DECL_KEYWORDS = new Set([
  'theorem', 'lemma', 'def', 'abbrev', 'example', 'instance', 'structure',
  'inductive', 'class', 'namespace', 'section', 'end', 'variable', 'open',
  'import', 'universe', 'noncomputable', 'mutual', 'where', 'deriving',
  'set_option', 'attribute',
]);

// Tactic / term-mode keywords, colored like DOTS operators.
const TACTIC_KEYWORDS = new Set([
  'by', 'have', 'obtain', 'exact', 'intro', 'intros', 'rintro', 'apply',
  'refine', 'rw', 'simp', 'omega', 'rcases', 'induction', 'cases', 'by_cases',
  'by_contra', 'constructor', 'use', 'calc', 'show', 'from', 'let', 'fun',
  'match', 'with', 'at', 'do', 'if', 'then', 'else', 'rfl', 'decide', 'norm_num',
]);

function span(color: string, text: string, extra = ''): string {
  return `<span style="color: var(${color})${extra}">${escapeHtml(text)}</span>`;
}

// Returns HTML string for use with react-simple-code-editor.
// Handles Lean's nested block comments (/- ... -/, incl. /-- and /-!) across
// lines, line comments, strings, declaration headers, and tactic keywords.
export function highlightLeanCode(code: string): string {
  let result = '';
  let i = 0;

  while (i < code.length) {
    const rest = code.slice(i);

    // Block comments nest in Lean: scan forward tracking depth.
    if (rest.startsWith('/-')) {
      let depth = 0;
      let j = i;
      while (j < code.length) {
        if (code.startsWith('/-', j)) {
          depth++;
          j += 2;
        } else if (code.startsWith('-/', j)) {
          depth--;
          j += 2;
          if (depth === 0) break;
        } else {
          j++;
        }
      }
      result += span('--syntax-comment', code.slice(i, j), '; font-style: italic');
      i = j;
      continue;
    }

    // Line comment
    const lineComment = rest.match(/^--[^\n]*/);
    if (lineComment) {
      result += span('--syntax-comment', lineComment[0], '; font-style: italic');
      i += lineComment[0].length;
      continue;
    }

    // Strings (with escape sequences)
    const str = rest.match(/^"([^"\\]|\\.)*"/);
    if (str) {
      result += span('--syntax-string', str[0]);
      i += str[0].length;
      continue;
    }

    // ASCII identifiers / keywords (Lean names may continue with ', !, ?, .)
    const word = rest.match(/^[A-Za-z_][A-Za-z0-9_'!?]*/);
    if (word) {
      const w = word[0];
      if (w === 'sorry') {
        result += span('--syntax-constant', w, '; font-weight: 500');
      } else if (DECL_KEYWORDS.has(w)) {
        result += span('--syntax-keyword', w, '; font-weight: 500');
        // The declared (possibly dotted) name after a header keyword.
        const name = rest.slice(w.length).match(/^(\s+)([A-Za-z_][A-Za-z0-9_.']*)/);
        if (name && (w === 'theorem' || w === 'lemma' || w === 'def' || w === 'abbrev' || w === 'namespace' || w === 'structure' || w === 'inductive' || w === 'class')) {
          result += name[1] + span('--syntax-type', name[2]);
          i += name[0].length;
        }
      } else if (TACTIC_KEYWORDS.has(w)) {
        result += span('--syntax-operator', w);
      } else {
        result += escapeHtml(w);
      }
      i += w.length;
      continue;
    }

    // Numbers
    const num = rest.match(/^\d[\d.]*/);
    if (num) {
      result += span('--syntax-number', num[0]);
      i += num[0].length;
      continue;
    }

    // Plain run up to the next character that could start a token above.
    const plain = rest.match(/^[^A-Za-z_0-9"\-/]+/);
    if (plain) {
      result += escapeHtml(plain[0]);
      i += plain[0].length;
      continue;
    }

    // A lone '-' or '/' that opens no comment.
    result += escapeHtml(code[i]);
    i += 1;
  }

  return result;
}
