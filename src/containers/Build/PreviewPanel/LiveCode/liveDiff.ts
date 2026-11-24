// The live code view's model (Mikey 11-24: "make the change actually look like
// vscode changes"): a whole-file inline diff against the last saved file, the
// way VS Code's inline diff editor shows it. Unchanged lines keep both line
// numbers; removed lines (red) only have the old number; added lines (green)
// only the new one; an added line that replaces removed ones is "modified"
// (a blue gutter bar). Long unchanged stretches fold away.

export type LiveRowKind = 'context' | 'added' | 'removed';

export interface LiveRow {
  kind: LiveRowKind;
  text: string;
  oldNo: number | null; // 1-based
  newNo: number | null; // 1-based
  modified: boolean; // added line that replaces removed lines
}

export interface LiveFold {
  kind: 'fold';
  key: string;
  count: number;
  rows: LiveRow[];
}

export type LiveDisplayItem = LiveRow | LiveFold;

// Above this many cells the middle section is shown as a block replace
// instead of an exact line match (keeps a huge rewrite cheap).
const MAX_LCS_CELLS = 1_500_000;

export function splitLines(text: string) {
  return String(text || '').split('\n');
}

export function diffLines(oldText: string, newText: string): LiveRow[] {
  const a = splitLines(oldText);
  const b = splitLines(newText);
  if (!oldText) {
    return b.map((text, i) => ({
      kind: 'added' as const,
      text,
      oldNo: null,
      newNo: i + 1,
      modified: false
    }));
  }
  // Shared head and tail first: a streamed edit usually touches one region.
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    a[a.length - 1 - tail] === b[b.length - 1 - tail]
  ) {
    tail++;
  }
  const rows: LiveRow[] = [];
  for (let i = 0; i < head; i++) {
    rows.push({ kind: 'context', text: a[i], oldNo: i + 1, newNo: i + 1, modified: false });
  }
  const midA = a.slice(head, a.length - tail);
  const midB = b.slice(head, b.length - tail);
  const middle: LiveRow[] = [];
  if (midA.length * midB.length > MAX_LCS_CELLS) {
    midA.forEach((text, i) =>
      middle.push({ kind: 'removed', text, oldNo: head + i + 1, newNo: null, modified: false })
    );
    midB.forEach((text, j) =>
      middle.push({ kind: 'added', text, oldNo: null, newNo: head + j + 1, modified: false })
    );
  } else {
    const m = midA.length;
    const n = midB.length;
    const table = new Uint32Array((m + 1) * (n + 1));
    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        table[i * (n + 1) + j] =
          midA[i] === midB[j]
            ? table[(i + 1) * (n + 1) + j + 1] + 1
            : Math.max(table[(i + 1) * (n + 1) + j], table[i * (n + 1) + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < m || j < n) {
      if (i < m && j < n && midA[i] === midB[j]) {
        middle.push({ kind: 'context', text: midA[i], oldNo: head + i + 1, newNo: head + j + 1, modified: false });
        i++;
        j++;
      } else if (i < m && (j >= n || table[(i + 1) * (n + 1) + j] >= table[i * (n + 1) + j + 1])) {
        middle.push({ kind: 'removed', text: midA[i], oldNo: head + i + 1, newNo: null, modified: false });
        i++;
      } else {
        middle.push({ kind: 'added', text: midB[j], oldNo: null, newNo: head + j + 1, modified: false });
        j++;
      }
    }
  }
  // Removed lines go before the added lines that replace them, and those
  // added lines count as modified.
  let k = 0;
  while (k < middle.length) {
    if (middle[k].kind === 'context') {
      rows.push(middle[k]);
      k++;
      continue;
    }
    const removed: LiveRow[] = [];
    const added: LiveRow[] = [];
    while (k < middle.length && middle[k].kind !== 'context') {
      (middle[k].kind === 'removed' ? removed : added).push(middle[k]);
      k++;
    }
    rows.push(...removed);
    added.forEach((row, index) =>
      rows.push({ ...row, modified: index < removed.length })
    );
  }
  for (let t = tail; t > 0; t--) {
    const oi = a.length - t;
    const ni = b.length - t;
    rows.push({ kind: 'context', text: a[oi], oldNo: oi + 1, newNo: ni + 1, modified: false });
  }
  return rows;
}

// Keep CONTEXT lines around every change and fold the rest of each long
// unchanged run. A file without changes is shown whole.
export function foldRows(
  rows: LiveRow[],
  { context = 3, minFold = 8, expanded = new Set<string>() } = {}
): LiveDisplayItem[] {
  if (!rows.some((row) => row.kind !== 'context')) return rows;
  const out: LiveDisplayItem[] = [];
  let i = 0;
  while (i < rows.length) {
    if (rows[i].kind !== 'context') {
      out.push(rows[i]);
      i++;
      continue;
    }
    let end = i;
    while (end < rows.length && rows[end].kind === 'context') end++;
    const run = rows.slice(i, end);
    const keepStart = i === 0 ? 0 : context;
    const keepEnd = end === rows.length ? 0 : context;
    const hidden = run.length - keepStart - keepEnd;
    const key = `fold-${run[0].newNo}`;
    if (hidden >= minFold && !expanded.has(key)) {
      out.push(...run.slice(0, keepStart));
      out.push({ kind: 'fold', key, count: hidden, rows: run.slice(keepStart, run.length - keepEnd) });
      out.push(...run.slice(run.length - keepEnd));
    } else {
      out.push(...run);
    }
    i = end;
  }
  return out;
}

export function diffStats(rows: LiveRow[]) {
  let added = 0;
  let removed = 0;
  for (const row of rows) {
    if (row.kind === 'added') added++;
    else if (row.kind === 'removed') removed++;
  }
  return { added, removed };
}

// Which new-file lines this update brought in, compared with what was on
// screen a moment ago: those are the lines the cursor types out.
export function freshLineNumbers(previousText: string, nextText: string) {
  const fresh: number[] = [];
  for (const row of diffLines(previousText, nextText)) {
    if (row.kind === 'added' && row.newNo !== null && row.text.trim()) {
      fresh.push(row.newNo);
    }
  }
  return fresh;
}

export function languageForPath(path: string) {
  const ext = String(path || '').toLowerCase().split('.').pop() || '';
  switch (ext) {
    case 'js':
    case 'mjs':
    case 'cjs':
      return { prism: 'javascript', label: 'JavaScript', badge: 'JS', color: '#f1dd35' };
    case 'jsx':
      return { prism: 'jsx', label: 'JavaScript JSX', badge: 'JSX', color: '#61dafb' };
    case 'ts':
      return { prism: 'typescript', label: 'TypeScript', badge: 'TS', color: '#3b8eea' };
    case 'tsx':
      return { prism: 'tsx', label: 'TypeScript JSX', badge: 'TSX', color: '#3b8eea' };
    case 'html':
    case 'htm':
      return { prism: 'markup', label: 'HTML', badge: '<>', color: '#e44d26' };
    case 'css':
      return { prism: 'css', label: 'CSS', badge: '#', color: '#42a5f5' };
    case 'json':
      return { prism: 'json', label: 'JSON', badge: '{}', color: '#cbcb41' };
    case 'md':
      return { prism: 'markdown', label: 'Markdown', badge: 'M↓', color: '#519aba' };
    case 'svg':
      return { prism: 'markup', label: 'SVG', badge: 'SVG', color: '#ffb13b' };
    default:
      return { prism: 'plain', label: 'Plain Text', badge: '≡', color: '#a0a0a0' };
  }
}
