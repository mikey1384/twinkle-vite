export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

export interface DiffResult {
  lines: DiffLine[];
  stats: {
    added: number;
    removed: number;
  };
}

/**
 * Simple line-based diff algorithm.
 * Uses longest common subsequence (LCS) approach for better diff quality.
 */
export function computeLineDiff(oldText: string, newText: string): DiffResult {
  const oldLines = (oldText || '').split('\n');
  const newLines = (newText || '').split('\n');

  // Build LCS table
  const lcs = buildLCSTable(oldLines, newLines);

  // Backtrack to find diff
  const lines = backtrackDiff(oldLines, newLines, lcs);

  // Calculate stats
  const stats = {
    added: lines.filter((l) => l.type === 'added').length,
    removed: lines.filter((l) => l.type === 'removed').length
  };

  return { lines, stats };
}

function buildLCSTable(oldLines: string[], newLines: string[]): number[][] {
  const m = oldLines.length;
  const n = newLines.length;
  const table: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1;
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
  }

  return table;
}

function backtrackDiff(
  oldLines: string[],
  newLines: string[],
  lcs: number[][]
): DiffLine[] {
  const result: DiffLine[] = [];
  let i = oldLines.length;
  let j = newLines.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'unchanged', content: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      result.unshift({ type: 'added', content: newLines[j - 1] });
      j--;
    } else if (i > 0) {
      result.unshift({ type: 'removed', content: oldLines[i - 1] });
      i--;
    }
  }

  return result;
}

/**
 * Get a summary string of the diff (e.g., "+12 -3")
 */
export function getDiffSummary(oldText: string, newText: string): string {
  const { stats } = computeLineDiff(oldText, newText);
  const parts: string[] = [];
  if (stats.added > 0) parts.push(`+${stats.added}`);
  if (stats.removed > 0) parts.push(`-${stats.removed}`);
  return parts.join(' ') || 'No changes';
}
