import type {
  EditableProjectFile,
  ProjectExplorerEntry
} from './types';

interface ProjectFileTreeFolder {
  path: string;
  name: string;
  folders: ProjectFileTreeFolder[];
  files: EditableProjectFile[];
}

export function normalizeProjectFilePath(rawPath: string) {
  const source = String(rawPath || '').trim().replace(/\\/g, '/');
  const withRoot = source.startsWith('/') ? source : `/${source}`;
  const normalized = withRoot
    .replace(/\/{2,}/g, '/')
    .replace(/\/\.\//g, '/');
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

function normalizeProjectFileLookupPath(rawPath: string) {
  return normalizeProjectFilePath(rawPath).toLowerCase();
}

export function isIndexHtmlPath(filePath: string) {
  const normalized = normalizeProjectFilePath(filePath).toLowerCase();
  return normalized === '/index.html' || normalized === '/index.htm';
}

export function getPreferredIndexFile<T extends { path: string }>(files: T[]) {
  let htmMatch: T | null = null;
  for (const file of files || []) {
    const normalized = normalizeProjectFilePath(file.path).toLowerCase();
    if (normalized === '/index.html') {
      return file;
    }
    if (!htmMatch && normalized === '/index.htm') {
      htmMatch = file;
    }
  }
  return htmMatch;
}

export function getPreferredIndexPath<T extends { path: string }>(files: T[]) {
  return getPreferredIndexFile(files)?.path || null;
}

export function getFileNameFromPath(filePath: string) {
  const normalized = normalizeProjectFilePath(filePath);
  const parts = normalized.split('/').filter(Boolean);
  return parts[parts.length - 1] || normalized;
}

export function buildEditableProjectFiles({
  code,
  projectFiles
}: {
  code: string | null;
  projectFiles: Array<{ path: string; content?: string }>;
}): EditableProjectFile[] {
  const deduped = new Map<string, string>();
  for (const file of projectFiles || []) {
    if (!file || typeof file !== 'object') continue;
    const normalizedPath = normalizeProjectFilePath(file.path);
    if (!normalizedPath || normalizedPath === '/') continue;
    deduped.set(
      normalizedPath,
      typeof file.content === 'string' ? file.content : ''
    );
  }
  if (!Array.from(deduped.keys()).some((path) => isIndexHtmlPath(path))) {
    deduped.set('/index.html', String(code || ''));
  }
  return Array.from(deduped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([path, content]) => ({ path, content }));
}

export function serializeEditableProjectFiles(files: EditableProjectFile[]) {
  return files.map((file) => `${file.path}\n${file.content}`).join('\n---\n');
}

export function listCaseInsensitiveProjectFileCollisionPaths<
  T extends { path: string }
>(files: T[]) {
  const firstPathByLookup = new Map<string, string>();
  const collisionPaths = new Set<string>();

  for (const file of files || []) {
    if (!file || typeof file.path !== 'string') continue;
    const normalizedPath = normalizeProjectFilePath(file.path);
    const lookupPath = normalizeProjectFileLookupPath(normalizedPath);
    const firstPath = firstPathByLookup.get(lookupPath);

    if (!firstPath) {
      firstPathByLookup.set(lookupPath, normalizedPath);
      continue;
    }

    if (firstPath !== normalizedPath) {
      collisionPaths.add(firstPath);
      collisionPaths.add(normalizedPath);
    }
  }

  return Array.from(collisionPaths).sort((a, b) => a.localeCompare(b));
}

export function isPathWithinFolder(filePath: string, folderPath: string) {
  const normalizedFile = normalizeProjectFilePath(filePath);
  const normalizedFolder = normalizeProjectFilePath(folderPath);
  if (normalizedFolder === '/') return true;
  return normalizedFile.startsWith(`${normalizedFolder}/`);
}

export function remapPathPrefix({
  filePath,
  fromPrefix,
  toPrefix
}: {
  filePath: string;
  fromPrefix: string;
  toPrefix: string;
}) {
  const normalizedFilePath = normalizeProjectFilePath(filePath);
  const normalizedFrom = normalizeProjectFilePath(fromPrefix);
  const normalizedTo = normalizeProjectFilePath(toPrefix);
  if (normalizedFilePath === normalizedFrom) {
    return normalizedTo;
  }
  if (normalizedFilePath.startsWith(`${normalizedFrom}/`)) {
    return `${normalizedTo}${normalizedFilePath.slice(normalizedFrom.length)}`;
  }
  return normalizedFilePath;
}

function buildProjectFileTree(files: EditableProjectFile[]) {
  const root: ProjectFileTreeFolder = {
    path: '/',
    name: '',
    folders: [],
    files: []
  };
  const folderByPath = new Map<string, ProjectFileTreeFolder>([['/', root]]);
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sortedFiles) {
    const normalizedPath = normalizeProjectFilePath(file.path);
    const pathParts = normalizedPath.split('/').filter(Boolean);
    const fileName = pathParts[pathParts.length - 1];
    if (!fileName) continue;
    const folderParts = pathParts.slice(0, -1);
    let currentFolder = root;
    let currentPath = '';

    for (const segment of folderParts) {
      currentPath += `/${segment}`;
      let nextFolder = folderByPath.get(currentPath);
      if (!nextFolder) {
        nextFolder = {
          path: currentPath,
          name: segment,
          folders: [],
          files: []
        };
        currentFolder.folders.push(nextFolder);
        folderByPath.set(currentPath, nextFolder);
      }
      currentFolder = nextFolder;
    }

    currentFolder.files.push({
      path: normalizedPath,
      content: file.content
    });
  }

  function sortFolder(folder: ProjectFileTreeFolder) {
    folder.folders.sort((a, b) => a.path.localeCompare(b.path));
    folder.files.sort((a, b) => a.path.localeCompare(b.path));
    for (const childFolder of folder.folders) {
      sortFolder(childFolder);
    }
  }

  sortFolder(root);
  return root;
}

function countFolderFiles(folder: ProjectFileTreeFolder): number {
  return folder.files.length + folder.folders.reduce((sum, childFolder) => {
    return sum + countFolderFiles(childFolder);
  }, 0);
}

export function buildProjectExplorerEntries({
  files,
  collapsedFolders
}: {
  files: EditableProjectFile[];
  collapsedFolders: Record<string, boolean>;
}) {
  const root = buildProjectFileTree(files);
  const entries: ProjectExplorerEntry[] = [];

  function visitFolder(folder: ProjectFileTreeFolder, depth: number) {
    for (const childFolder of folder.folders) {
      const isCollapsed = Boolean(collapsedFolders[childFolder.path]);
      entries.push({
        kind: 'folder',
        path: childFolder.path,
        name: childFolder.name,
        depth,
        fileCount: countFolderFiles(childFolder)
      });
      if (!isCollapsed) {
        visitFolder(childFolder, depth + 1);
      }
    }
    for (const file of folder.files) {
      entries.push({
        kind: 'file',
        file,
        depth
      });
    }
  }

  visitFolder(root, 0);
  return entries;
}
