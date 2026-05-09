export const DEFAULT_PROJECT_FILE_EFFECTIVE_LINE_LIMIT = 500;
export const PROJECT_FILE_EFFECTIVE_LINE_MAX_COLUMNS = 160;

export function resolveProjectFileEffectiveLineLimit(maxProjectFileLines: number) {
  if (!Number.isFinite(maxProjectFileLines) || maxProjectFileLines <= 0) {
    return DEFAULT_PROJECT_FILE_EFFECTIVE_LINE_LIMIT;
  }
  return Math.floor(maxProjectFileLines);
}

export function normalizeProjectFileContent(content: string) {
  return String(content || '').replace(/\r\n?/g, '\n');
}

export function getProjectFilePhysicalLines(content: string) {
  const normalizedContent = normalizeProjectFileContent(content);
  if (!normalizedContent) return [];
  return normalizedContent.split('\n');
}

export function countProjectFileEffectiveLines(
  content: string,
  maxColumns = PROJECT_FILE_EFFECTIVE_LINE_MAX_COLUMNS
) {
  const lines = getProjectFilePhysicalLines(content);
  if (lines.length === 0) return 0;
  const resolvedMaxColumns =
    Number.isFinite(maxColumns) && maxColumns > 0
      ? Math.floor(maxColumns)
      : PROJECT_FILE_EFFECTIVE_LINE_MAX_COLUMNS;
  return lines.reduce(
    (total, line) =>
      total + Math.max(1, Math.ceil(line.length / resolvedMaxColumns)),
    0
  );
}

export function formatProjectFileEffectiveLineCount(
  effectiveLineCount: number,
  maxLines: number
) {
  return `${effectiveLineCount}/${maxLines}`;
}
