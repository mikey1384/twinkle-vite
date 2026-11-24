import { Prism, normalizeTokens } from 'prism-react-renderer';

// VS Code "Dark Modern" editor colours for the live code view. Lines are
// tokenised once per file version (multi-line comments and strings need the
// whole file) and cached, so typing animation only slices finished tokens.

export const VSCODE = {
  editorBg: '#1f1f1f',
  editorFg: '#cccccc',
  gutterFg: '#6e7681',
  gutterActiveFg: '#cccccc',
  lineHighlight: '#282828',
  tabBarBg: '#181818',
  tabBg: '#181818',
  tabActiveBg: '#1f1f1f',
  tabActiveTop: '#0078d4',
  tabFg: '#9d9d9d',
  tabActiveFg: '#ffffff',
  border: '#2b2b2b',
  breadcrumbFg: '#a9a9a9',
  statusBg: '#0078d4',
  statusFg: '#ffffff',
  addedBg: 'rgba(46, 160, 67, 0.18)',
  addedText: 'rgba(46, 160, 67, 0.34)',
  removedBg: 'rgba(248, 81, 73, 0.16)',
  addedGutter: '#2ea043',
  modifiedGutter: '#0078d4',
  removedGutter: '#f85149',
  foldBg: '#252526',
  foldFg: '#8b949e',
  cursor: '#aeafad',
  gitAdded: '#73c991',
  gitModified: '#e2c08d'
};

const TOKEN_COLORS: Array<[RegExp, string]> = [
  [/comment|prolog|doctype|cdata/, '#6a9955'],
  [/keyword-control|control|module|^keyword$/, '#c586c0'],
  [/boolean|constant|null|undefined|nil/, '#569cd6'],
  [/number/, '#b5cea8'],
  [/string|char|attr-value|template-string|url/, '#ce9178'],
  [/regex/, '#d16969'],
  [/function|method/, '#dcdcaa'],
  [/class-name|builtin|maybe-class-name/, '#4ec9b0'],
  [/tag/, '#569cd6'],
  [/attr-name/, '#9cdcfe'],
  [/selector/, '#d7ba7d'],
  [/property|parameter|variable|imports|exports/, '#9cdcfe'],
  [/atrule|rule|important/, '#c586c0'],
  [/operator|entity/, '#d4d4d4'],
  [/punctuation/, '#cccccc']
];

// Prism names `const`/`let`/`function` plain "keyword"; VS Code shows those
// blue and control flow purple.
const CONTROL_WORDS = new Set([
  'if', 'else', 'for', 'while', 'do', 'return', 'switch', 'case', 'break',
  'continue', 'try', 'catch', 'finally', 'throw', 'await', 'import', 'export',
  'from', 'default', 'yield', 'of', 'in'
]);

export interface LiveToken {
  text: string;
  color: string;
}

function colorFor(types: string[], content: string) {
  const joined = types.join(' ');
  if (types.includes('keyword')) {
    return CONTROL_WORDS.has(content.trim()) ? '#c586c0' : '#569cd6';
  }
  for (const [pattern, color] of TOKEN_COLORS) {
    if (pattern.test(joined)) return color;
  }
  return VSCODE.editorFg;
}

const cache = new Map<string, LiveToken[][]>();
const CACHE_LIMIT = 24;

export function tokenizeLines(code: string, language: string): LiveToken[][] {
  const key = `${language}\u0000${code}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const lines = String(code || '').split('\n');
  let result: LiveToken[][];
  const grammar = Prism.languages[language];
  if (!grammar || language === 'plain' || code.length > 400_000) {
    result = lines.map((line) => [{ text: line, color: VSCODE.editorFg }]);
  } else {
    try {
      const normalized = normalizeTokens(Prism.tokenize(code, grammar));
      result = normalized.map((line) =>
        line
          .filter((token) => token.content.length > 0)
          .map((token) => ({
            text: token.content,
            color: colorFor(token.types, token.content)
          }))
      );
      // Safety: the tokeniser should keep the line count; fall back if not.
      if (result.length !== lines.length) {
        result = lines.map((line) => [{ text: line, color: VSCODE.editorFg }]);
      }
    } catch {
      result = lines.map((line) => [{ text: line, color: VSCODE.editorFg }]);
    }
  }
  cache.set(key, result);
  if (cache.size > CACHE_LIMIT) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  return result;
}

// The first `chars` characters of a tokenised line (for the typing cursor).
export function sliceTokens(tokens: LiveToken[], chars: number): LiveToken[] {
  const out: LiveToken[] = [];
  let left = chars;
  for (const token of tokens) {
    if (left <= 0) break;
    if (token.text.length <= left) {
      out.push(token);
      left -= token.text.length;
    } else {
      out.push({ text: token.text.slice(0, left), color: token.color });
      left = 0;
    }
  }
  return out;
}
