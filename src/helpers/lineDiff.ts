// Line-level diff for showing a creator what a reviewer changed in a file.
// Myers' O(ND) algorithm over lines, with a guard for very large inputs so a
// pathological file never freezes the page: past the guard the file is shown
// as fully replaced instead of line by line.

export type LineDiffOp = 'equal' | 'add' | 'remove';

export interface LineDiffEntry {
  op: LineDiffOp;
  text: string;
  // 1-based line numbers on each side; absent when the line is not on that side.
  before?: number;
  after?: number;
}

export interface LineDiffHunk {
  entries: LineDiffEntry[];
  beforeStart: number;
  afterStart: number;
}

export const LINE_DIFF_MAX_LINES = 6000;
export const LINE_DIFF_MAX_EDIT_DISTANCE = 4000;

export function splitLines(text: string) {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function replacedEntirely(before: string[], after: string[]): LineDiffEntry[] {
  return [
    ...before.map((text, index) => ({
      op: 'remove' as const,
      text,
      before: index + 1
    })),
    ...after.map((text, index) => ({
      op: 'add' as const,
      text,
      after: index + 1
    }))
  ];
}

// Returns one entry per line of the combined view, in order.
export function diffLines(beforeText: string, afterText: string): {
  entries: LineDiffEntry[];
  truncated: boolean;
} {
  const before = splitLines(beforeText);
  const after = splitLines(afterText);
  if (beforeText === afterText) {
    return {
      entries: before.map((text, index) => ({
        op: 'equal',
        text,
        before: index + 1,
        after: index + 1
      })),
      truncated: false
    };
  }
  if (
    before.length > LINE_DIFF_MAX_LINES ||
    after.length > LINE_DIFF_MAX_LINES
  ) {
    return { entries: replacedEntirely(before, after), truncated: true };
  }
  // Trim the common prefix and suffix first: most edits touch a small region.
  let prefix = 0;
  while (
    prefix < before.length &&
    prefix < after.length &&
    before[prefix] === after[prefix]
  ) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < before.length - prefix &&
    suffix < after.length - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const a = before.slice(prefix, before.length - suffix);
  const b = after.slice(prefix, after.length - suffix);
  const middle = myers(a, b);
  if (!middle) {
    return { entries: replacedEntirely(before, after), truncated: true };
  }
  const entries: LineDiffEntry[] = [];
  for (let index = 0; index < prefix; index += 1) {
    entries.push({
      op: 'equal',
      text: before[index],
      before: index + 1,
      after: index + 1
    });
  }
  let beforeLine = prefix;
  let afterLine = prefix;
  for (const step of middle) {
    if (step.op === 'equal') {
      beforeLine += 1;
      afterLine += 1;
      entries.push({
        op: 'equal',
        text: step.text,
        before: beforeLine,
        after: afterLine
      });
    } else if (step.op === 'remove') {
      beforeLine += 1;
      entries.push({ op: 'remove', text: step.text, before: beforeLine });
    } else {
      afterLine += 1;
      entries.push({ op: 'add', text: step.text, after: afterLine });
    }
  }
  for (let index = 0; index < suffix; index += 1) {
    const beforeIndex = before.length - suffix + index;
    const afterIndex = after.length - suffix + index;
    entries.push({
      op: 'equal',
      text: before[beforeIndex],
      before: beforeIndex + 1,
      after: afterIndex + 1
    });
  }
  return { entries, truncated: false };
}

// Classic Myers diff on two line arrays. Returns null when the edit distance
// exceeds the guard, so the caller can fall back to "replaced".
function myers(
  a: string[],
  b: string[]
): Array<{ op: LineDiffOp; text: string }> | null {
  const n = a.length;
  const m = b.length;
  if (n === 0 && m === 0) return [];
  const max = Math.min(n + m, LINE_DIFF_MAX_EDIT_DISTANCE);
  const offset = max;
  const v = new Int32Array(2 * max + 2);
  const trace: Int32Array[] = [];
  let found = false;
  for (let d = 0; d <= max; d += 1) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) {
        x = v[offset + k + 1];
      } else {
        x = v[offset + k - 1] + 1;
      }
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x += 1;
        y += 1;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) {
        found = true;
        break;
      }
    }
    if (found) break;
  }
  if (!found) return null;
  // Backtrack.
  const steps: Array<{ op: LineDiffOp; text: string }> = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d > 0; d -= 1) {
    const prev = trace[d];
    const k = x - y;
    let prevK: number;
    if (k === -d || (k !== d && prev[offset + k - 1] < prev[offset + k + 1])) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }
    const prevX = prev[offset + prevK];
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      x -= 1;
      y -= 1;
      steps.push({ op: 'equal', text: a[x] });
    }
    if (x === prevX) {
      y -= 1;
      steps.push({ op: 'add', text: b[y] });
    } else {
      x -= 1;
      steps.push({ op: 'remove', text: a[x] });
    }
  }
  while (x > 0 && y > 0) {
    x -= 1;
    y -= 1;
    steps.push({ op: 'equal', text: a[x] });
  }
  while (x > 0) {
    x -= 1;
    steps.push({ op: 'remove', text: a[x] });
  }
  while (y > 0) {
    y -= 1;
    steps.push({ op: 'add', text: b[y] });
  }
  steps.reverse();
  return steps;
}

// Groups a full diff into hunks with `context` unchanged lines around each
// change, the way a reviewer expects to read it.
export function buildLineDiffHunks(
  entries: LineDiffEntry[],
  context = 3
): LineDiffHunk[] {
  const hunks: LineDiffHunk[] = [];
  let current: LineDiffHunk | null = null;
  let pendingEqual: LineDiffEntry[] = [];
  for (const entry of entries) {
    if (entry.op === 'equal') {
      if (current) {
        if (pendingEqual.length < context) {
          pendingEqual.push(entry);
        } else {
          // Enough trailing context: close the hunk, keep sliding window.
          current.entries.push(...pendingEqual);
          hunks.push(current);
          current = null;
          pendingEqual = [entry];
        }
      } else {
        pendingEqual.push(entry);
        if (pendingEqual.length > context) pendingEqual.shift();
      }
      continue;
    }
    if (!current) {
      const first = pendingEqual[0] || entry;
      current = {
        entries: [],
        beforeStart: first.before ?? entry.before ?? 1,
        afterStart: first.after ?? entry.after ?? 1
      };
    }
    current.entries.push(...pendingEqual);
    pendingEqual = [];
    current.entries.push(entry);
  }
  if (current) {
    current.entries.push(...pendingEqual.slice(0, context));
    hunks.push(current);
  }
  return hunks;
}
