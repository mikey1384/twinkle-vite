export const EMPTY_BUILD_PROJECT_FILES: Array<{ path: string; content?: string }> = [];

export function normalizeProjectFilePath(rawPath: string) {
  const source = String(rawPath || '')
    .trim()
    .replace(/\\/g, '/');
  const withRoot = source.startsWith('/') ? source : `/${source}`;
  const normalized = withRoot.replace(/\/{2,}/g, '/').replace(/\/\.\//g, '/');
  const parts = normalized.split('/');
  const out: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      out.pop();
      continue;
    }
    out.push(part);
  }
  return `/${out.join('/')}`;
}

export function resolveIndexHtmlFromProjectFiles(
  files: Array<{ path: string; content?: string }>,
  fallbackCode: string | null | undefined
) {
  const byPath = new Map<string, string>();
  for (const file of files || []) {
    const normalizedPath = normalizeProjectFilePath(file.path);
    if (typeof file.content !== 'string') continue;
    byPath.set(normalizedPath.toLowerCase(), file.content);
  }
  if (byPath.has('/index.html')) {
    return byPath.get('/index.html') ?? '';
  }
  if (byPath.has('/index.htm')) {
    return byPath.get('/index.htm') ?? '';
  }
  return String(fallbackCode || '');
}

export function resolveIndexEntryPathFromProjectFiles(
  files: Array<{ path: string; content?: string }>,
  fallbackEntryPath = '/index.html'
) {
  const byPath = new Map<string, string>();
  for (const file of files || []) {
    const normalizedPath = normalizeProjectFilePath(file.path);
    const lookupPath = normalizedPath.toLowerCase();
    if (!byPath.has(lookupPath)) {
      byPath.set(lookupPath, normalizedPath);
    }
  }
  return (
    byPath.get('/index.html') ||
    byPath.get('/index.htm') ||
    normalizeProjectFilePath(fallbackEntryPath)
  );
}

export function normalizeProjectFilesForBuild(
  files: Array<{ path: string; content?: string }>,
  fallbackCode: string | null | undefined
) {
  const deduped = new Map<string, string>();
  for (const file of files || []) {
    if (!file || typeof file !== 'object') continue;
    const normalizedPath = normalizeProjectFilePath(file.path);
    if (!normalizedPath || normalizedPath === '/') continue;
    deduped.set(
      normalizedPath,
      typeof file.content === 'string' ? file.content : ''
    );
  }
  const hasIndex = Array.from(deduped.keys()).some(
    (path) =>
      path.toLowerCase() === '/index.html' ||
      path.toLowerCase() === '/index.htm'
  );
  if (!hasIndex) {
    deduped.set('/index.html', String(fallbackCode || ''));
  }
  return Array.from(deduped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([path, content]) => ({
      path,
      content,
      sizeBytes: content.length
    }));
}

export function applyArtifactCodeToProjectFiles({
  projectFiles,
  artifactCode,
  entryPath
}: {
  projectFiles: Array<{ path: string; content?: string }>;
  artifactCode: string;
  entryPath?: string | null;
}) {
  const normalizedProjectFiles = normalizeProjectFilesForBuild(
    projectFiles,
    artifactCode
  );
  const resolvedEntryPath = resolveIndexEntryPathFromProjectFiles(
    normalizedProjectFiles,
    entryPath || '/index.html'
  );
  const entryLookupPath = normalizeProjectFilePath(resolvedEntryPath).toLowerCase();
  let updatedEntry = false;
  const nextProjectFiles = normalizedProjectFiles.map((file) => {
    if (normalizeProjectFilePath(file.path).toLowerCase() !== entryLookupPath) {
      return file;
    }
    updatedEntry = true;
    if (String(file.content || '') === artifactCode) {
      return file;
    }
    return {
      ...file,
      content: artifactCode,
      sizeBytes: artifactCode.length
    };
  });
  if (updatedEntry) {
    return nextProjectFiles;
  }
  return normalizeProjectFilesForBuild(
    [...normalizedProjectFiles, { path: resolvedEntryPath, content: artifactCode }],
    artifactCode
  );
}

export function projectFilesEqual(
  a: Array<{ path: string; content?: string }> | undefined,
  b: Array<{ path: string; content?: string }> | undefined
) {
  const left = normalizeProjectFilesForBuild(a || [], '');
  const right = normalizeProjectFilesForBuild(b || [], '');
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (
      left[i].path !== right[i].path ||
      String(left[i].content || '') !== String(right[i].content || '')
    ) {
      return false;
    }
  }
  return true;
}

export function serializedComparableValue(value: any) {
  try {
    return JSON.stringify(value ?? null) || 'null';
  } catch {
    return String(value ?? null);
  }
}
