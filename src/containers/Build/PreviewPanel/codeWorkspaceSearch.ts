import type { EditableProjectFile } from './types';
import {
  countProjectFileEffectiveLines,
  getProjectFilePhysicalLines
} from './projectFileEffectiveLines';

const PROJECT_FILE_LINE_WARNING_RATIO = 0.9;
const MAX_PROJECT_FILE_SEARCH_RESULTS = 40;

type ProjectFileLineDiagnosticSeverity = 'warning' | 'error';

export interface ProjectFileLineDiagnostic {
  path: string;
  effectiveLineCount: number;
  maxLines: number;
  severity: ProjectFileLineDiagnosticSeverity;
}

export interface ProjectFileSearchResult {
  path: string;
  lineNumber: number;
  lineText: string;
  beforeText: string;
  afterText: string;
}

export function buildProjectFileLineDiagnostics(
  files: EditableProjectFile[],
  maxLines: number
): ProjectFileLineDiagnostic[] {
  const warningThreshold = Math.max(
    1,
    Math.floor(maxLines * PROJECT_FILE_LINE_WARNING_RATIO)
  );

  return files
    .map((file) => {
      const effectiveLineCount = countProjectFileEffectiveLines(file.content);
      if (effectiveLineCount > maxLines) {
        return {
          path: file.path,
          effectiveLineCount,
          maxLines,
          severity: 'error' as const
        };
      }
      if (effectiveLineCount >= warningThreshold) {
        return {
          path: file.path,
          effectiveLineCount,
          maxLines,
          severity: 'warning' as const
        };
      }
      return null;
    })
    .filter(
      (diagnostic): diagnostic is ProjectFileLineDiagnostic =>
        diagnostic !== null
    )
    .sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === 'error' ? -1 : 1;
      }
      return b.effectiveLineCount - a.effectiveLineCount;
    });
}

export function searchProjectFileLines(
  files: EditableProjectFile[],
  rawQuery: string
): ProjectFileSearchResult[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];

  const results: ProjectFileSearchResult[] = [];
  for (const file of files) {
    const lines = getProjectFilePhysicalLines(file.content);
    for (let index = 0; index < lines.length; index += 1) {
      if (!lines[index].toLowerCase().includes(query)) {
        continue;
      }
      results.push({
        path: file.path,
        lineNumber: index + 1,
        lineText: lines[index],
        beforeText: lines[index - 1] || '',
        afterText: lines[index + 1] || ''
      });
      if (results.length >= MAX_PROJECT_FILE_SEARCH_RESULTS) {
        return results;
      }
    }
  }
  return results;
}

export function truncateSearchLine(line: string) {
  const trimmedLine = line.trim();
  if (trimmedLine.length <= 160) return trimmedLine;
  return `${trimmedLine.slice(0, 157)}...`;
}
