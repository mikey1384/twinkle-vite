import React, {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Icon from '~/components/Icon';
import Modal from '~/components/Modal';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import SegmentedToggle from '~/components/Buttons/SegmentedToggle';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { parse as parseJavaScriptModule } from '@babel/parser';
import { mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';

interface Build {
  id: number;
  title: string;
  username: string;
  primaryArtifactId?: number | null;
}

interface PreviewPanelProps {
  build: Build;
  code: string | null;
  projectFiles: Array<{
    path: string;
    content?: string;
  }>;
  isOwner: boolean;
  onReplaceCode: (code: string) => void;
  onApplyRestoredProjectFiles: (
    files: Array<{ path: string; content?: string }>,
    restoredCode?: string | null
  ) => void;
  onSaveProjectFiles: (
    files: Array<{ path: string; content?: string }>
  ) => Promise<{ success: boolean; error?: string }>;
  onEditableProjectFilesStateChange?: (state: {
    files: Array<{ path: string; content?: string }>;
    hasUnsavedChanges: boolean;
    saving: boolean;
  }) => void;
}

interface ArtifactVersion {
  id: number;
  version: number;
  summary: string | null;
  gitCommitSha: string | null;
  createdAt: number;
  createdByRole: 'user' | 'assistant';
}

interface PreviewSeedCacheEntry {
  buildId: number;
  codeSignature: string;
  src: string;
  cachedAt: number;
}

interface PreviewFrameMeta {
  buildId: number | null;
  codeSignature: string | null;
}

interface DocsConnectResult {
  success: boolean;
  message: string | null;
  buildId: number | null;
  connectNonce: string | null;
}

interface PendingDocsConnectRequest {
  buildId: number;
  promise: Promise<DocsConnectResult>;
}

const PREVIEW_SEED_CACHE_TTL_MS = 10 * 60 * 1000;
const PREVIEW_SEED_CACHE_MAX_ENTRIES = 8;
const MODULE_SPECIFIER_REWRITE_CACHE_MAX_ENTRIES = 500;
const previewSeedCache = new Map<number, PreviewSeedCacheEntry>();
const moduleSpecifierRewriteCache = new Map<string, string>();
const MUTATING_PREVIEW_REQUEST_TYPES = new Set([
  'ai:chat',
  'docs:connect-start',
  'docs:disconnect',
  'llm:generate',
  'db:save',
  'jobs:cancel',
  'jobs:claim-due',
  'jobs:schedule',
  'mail:send',
  'private-db:remove',
  'private-db:set',
  'shared-db:add-entry',
  'shared-db:create-topic',
  'shared-db:delete-entry',
  'shared-db:update-entry',
  'social:follow',
  'social:unfollow',
  'viewer-db:exec',
  'vocabulary:collect-word'
]);

function hashPreviewCode(code: string) {
  let hash = 2166136261;
  for (let i = 0; i < code.length; i++) {
    hash ^= code.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

function buildModuleSpecifierRewriteCacheKey({
  modulePath,
  source,
  localProjectPathsKey
}: {
  modulePath: string;
  source: string;
  localProjectPathsKey: string;
}) {
  const normalizedModulePath = normalizeProjectFilePath(modulePath || '/index.html');
  const sourceSignature = `${source.length}:${hashPreviewCode(source)}`;
  return `${normalizedModulePath}\n${localProjectPathsKey}\n${sourceSignature}`;
}

function readCachedModuleSpecifierRewrite(cacheKey: string) {
  const cached = moduleSpecifierRewriteCache.get(cacheKey);
  if (typeof cached !== 'string') return null;
  // Refresh insertion order for simple LRU behavior.
  moduleSpecifierRewriteCache.delete(cacheKey);
  moduleSpecifierRewriteCache.set(cacheKey, cached);
  return cached;
}

function writeCachedModuleSpecifierRewrite(cacheKey: string, rewrittenSource: string) {
  moduleSpecifierRewriteCache.set(cacheKey, rewrittenSource);
  while (
    moduleSpecifierRewriteCache.size > MODULE_SPECIFIER_REWRITE_CACHE_MAX_ENTRIES
  ) {
    const oldestKey = moduleSpecifierRewriteCache.keys().next().value;
    if (typeof oldestKey !== 'string') break;
    moduleSpecifierRewriteCache.delete(oldestKey);
  }
}

function buildPreviewCodeSignature(codeWithSdk: string | null) {
  if (!codeWithSdk) return null;
  return `${codeWithSdk.length}:${hashPreviewCode(codeWithSdk)}`;
}

function revokePreviewUrl(src: string | null | undefined) {
  if (!src) return;
  try {
    URL.revokeObjectURL(src);
  } catch {
    // no-op
  }
}

function prunePreviewSeedCache() {
  const now = Date.now();
  for (const [buildId, entry] of previewSeedCache.entries()) {
    if (now - entry.cachedAt > PREVIEW_SEED_CACHE_TTL_MS) {
      revokePreviewUrl(entry.src);
      previewSeedCache.delete(buildId);
    }
  }

  if (previewSeedCache.size <= PREVIEW_SEED_CACHE_MAX_ENTRIES) return;

  const oldestEntries = Array.from(previewSeedCache.entries()).sort(
    (a, b) => a[1].cachedAt - b[1].cachedAt
  );
  const overflow = previewSeedCache.size - PREVIEW_SEED_CACHE_MAX_ENTRIES;
  for (let i = 0; i < overflow; i++) {
    const [buildId, entry] = oldestEntries[i];
    revokePreviewUrl(entry.src);
    previewSeedCache.delete(buildId);
  }
}

function takeCachedPreviewSeed(buildId: number, codeSignature: string | null) {
  prunePreviewSeedCache();
  if (!codeSignature) return null;
  const entry = previewSeedCache.get(buildId);
  if (!entry) return null;
  if (entry.codeSignature !== codeSignature) return null;
  previewSeedCache.delete(buildId);
  return entry;
}

function putCachedPreviewSeed(entry: PreviewSeedCacheEntry) {
  prunePreviewSeedCache();
  const existing = previewSeedCache.get(entry.buildId);
  if (existing?.src && existing.src !== entry.src) {
    revokePreviewUrl(existing.src);
  }
  previewSeedCache.set(entry.buildId, entry);
  prunePreviewSeedCache();
}

function clearCachedPreviewSeed(buildId: number) {
  const existing = previewSeedCache.get(buildId);
  if (existing?.src) {
    revokePreviewUrl(existing.src);
  }
  previewSeedCache.delete(buildId);
}

function isMutatingPreviewRequestType(type: string) {
  return MUTATING_PREVIEW_REQUEST_TYPES.has(type);
}

function normalizeProjectFilePath(rawPath: string) {
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

function isIndexHtmlPath(filePath: string) {
  const normalized = normalizeProjectFilePath(filePath).toLowerCase();
  return normalized === '/index.html' || normalized === '/index.htm';
}

function getPreferredIndexFile<T extends { path: string }>(files: T[]) {
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

function getPreferredIndexPath<T extends { path: string }>(files: T[]) {
  return getPreferredIndexFile(files)?.path || null;
}

interface EditableProjectFile {
  path: string;
  content: string;
}

interface ProjectFileTreeFolder {
  path: string;
  name: string;
  folders: ProjectFileTreeFolder[];
  files: EditableProjectFile[];
}

interface ProjectExplorerEntryFolder {
  kind: 'folder';
  path: string;
  name: string;
  depth: number;
  fileCount: number;
}

interface ProjectExplorerEntryFile {
  kind: 'file';
  file: EditableProjectFile;
  depth: number;
}

type ProjectExplorerEntry = ProjectExplorerEntryFolder | ProjectExplorerEntryFile;

function getFileNameFromPath(filePath: string) {
  const normalized = normalizeProjectFilePath(filePath);
  const parts = normalized.split('/').filter(Boolean);
  return parts[parts.length - 1] || normalized;
}

function buildEditableProjectFiles({
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

function serializeEditableProjectFiles(files: EditableProjectFile[]) {
  return files.map((file) => `${file.path}\n${file.content}`).join('\n---\n');
}

function isPathWithinFolder(filePath: string, folderPath: string) {
  const normalizedFile = normalizeProjectFilePath(filePath);
  const normalizedFolder = normalizeProjectFilePath(folderPath);
  if (normalizedFolder === '/') return true;
  return normalizedFile.startsWith(`${normalizedFolder}/`);
}

function remapPathPrefix({
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

function buildProjectExplorerEntries({
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

function resolveLocalProjectPathFromBase(rawValue: string, basePath: string) {
  const value = String(rawValue || '').trim();
  if (!value || value.startsWith('#')) return null;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value) || value.startsWith('//')) {
    return null;
  }
  try {
    const normalizedBasePath = normalizeProjectFilePath(basePath || '/index.html');
    const url = new URL(value, `https://twinkle.local${normalizedBasePath}`);
    return normalizeProjectFilePath(url.pathname);
  } catch {
    return null;
  }
}

function resolveLocalProjectPath(rawValue: string) {
  return resolveLocalProjectPathFromBase(rawValue, '/index.html');
}

function isPotentialLocalModuleFile(filePath: string) {
  const normalized = normalizeProjectFilePath(filePath).toLowerCase();
  return (
    normalized.endsWith('.js') ||
    normalized.endsWith('.mjs') ||
    normalized.endsWith('.cjs') ||
    normalized.endsWith('.jsx') ||
    normalized.endsWith('.ts') ||
    normalized.endsWith('.tsx') ||
    normalized.endsWith('.json')
  );
}

function rewriteLocalModuleSpecifiersToAbsolutePaths({
  source,
  modulePath,
  localProjectPaths,
  localProjectPathsKey
}: {
  source: string;
  modulePath: string;
  localProjectPaths: Set<string>;
  localProjectPathsKey: string;
}) {
  const cacheKey = buildModuleSpecifierRewriteCacheKey({
    modulePath,
    source,
    localProjectPathsKey
  });
  const cachedSource = readCachedModuleSpecifierRewrite(cacheKey);
  if (cachedSource !== null) {
    return cachedSource;
  }
  const maybeRewriteSpecifier = (rawSpecifier: string) => {
    const resolvedPath = resolveLocalProjectPathFromBase(rawSpecifier, modulePath);
    if (!resolvedPath || !localProjectPaths.has(resolvedPath)) {
      return rawSpecifier;
    }
    return resolvedPath;
  };
  const rewrites: Array<{ start: number; end: number; replacement: string }> = [];

  function queueLiteralRewrite(node: any) {
    if (!node || typeof node !== 'object') return;
    if (node.type !== 'StringLiteral') return;
    if (typeof node.value !== 'string') return;
    if (!Number.isFinite(node.start) || !Number.isFinite(node.end)) return;
    const rewritten = maybeRewriteSpecifier(node.value);
    if (rewritten === node.value) return;
    rewrites.push({
      start: Number(node.start),
      end: Number(node.end),
      replacement: JSON.stringify(rewritten)
    });
  }

  function visitNode(node: any) {
    if (!node || typeof node !== 'object') return;

    if (
      node.type === 'ImportDeclaration' ||
      node.type === 'ExportAllDeclaration' ||
      node.type === 'ExportNamedDeclaration'
    ) {
      queueLiteralRewrite(node.source);
    } else if (node.type === 'ImportExpression') {
      queueLiteralRewrite(node.source);
    } else if (
      node.type === 'CallExpression' &&
      node.callee &&
      node.callee.type === 'Import' &&
      Array.isArray(node.arguments) &&
      node.arguments.length > 0
    ) {
      queueLiteralRewrite(node.arguments[0]);
    }

    for (const value of Object.values(node)) {
      if (!value) continue;
      if (Array.isArray(value)) {
        for (const child of value) {
          if (child && typeof child === 'object') {
            visitNode(child);
          }
        }
        continue;
      }
      if (value && typeof value === 'object') {
        visitNode(value);
      }
    }
  }

  try {
    const ast = parseJavaScriptModule(source, {
      sourceType: 'unambiguous',
      errorRecovery: true,
      plugins: [
        'jsx',
        'typescript',
        'dynamicImport',
        'importAttributes',
        'topLevelAwait',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'decorators-legacy'
      ]
    });
    visitNode(ast.program);
  } catch (parseError) {
    // Keep preview resilient: if module parsing fails, return source unchanged.
    console.error('Failed to parse module for specifier rewrite:', {
      modulePath,
      error: parseError
    });
    writeCachedModuleSpecifierRewrite(cacheKey, source);
    return source;
  }

  if (rewrites.length === 0) {
    writeCachedModuleSpecifierRewrite(cacheKey, source);
    return source;
  }

  rewrites.sort((a, b) => b.start - a.start);
  let rewritten = source;
  for (const entry of rewrites) {
    rewritten =
      rewritten.slice(0, entry.start) +
      entry.replacement +
      rewritten.slice(entry.end);
  }
  writeCachedModuleSpecifierRewrite(cacheKey, rewritten);
  return rewritten;
}

function buildLocalProjectPathsKey(localProjectPaths: Set<string>) {
  const sortedLocalProjectPaths = Array.from(localProjectPaths.values()).sort((a, b) =>
    a.localeCompare(b)
  );
  return `${sortedLocalProjectPaths.length}:${hashPreviewCode(
    sortedLocalProjectPaths.join('\n')
  )}`;
}

function buildLocalModuleImportMap({
  fileMap,
  localProjectPaths,
  localProjectPathsKey
}: {
  fileMap: Map<string, string>;
  localProjectPaths: Set<string>;
  localProjectPathsKey: string;
}) {
  const imports: Record<string, string> = {};
  for (const [filePath, source] of fileMap.entries()) {
    if (!isPotentialLocalModuleFile(filePath)) continue;
    const normalizedPath = normalizeProjectFilePath(filePath);
    const lowerPath = normalizedPath.toLowerCase();
    const isJsonModule = lowerPath.endsWith('.json');
    const rewrittenSource = isJsonModule
      ? source
      : rewriteLocalModuleSpecifiersToAbsolutePaths({
          source,
          modulePath: normalizedPath,
          localProjectPaths,
          localProjectPathsKey
        });
    const mimeType = isJsonModule ? 'application/json' : 'text/javascript';
    imports[normalizedPath] = `data:${mimeType};charset=utf-8,${encodeURIComponent(
      rewrittenSource
    )}`;
  }
  return imports;
}

function buildLocalScriptDataUrl({
  source,
  mimeType = 'text/javascript'
}: {
  source: string;
  mimeType?: string;
}) {
  return `data:${mimeType};charset=utf-8,${encodeURIComponent(source)}`;
}

function preserveLocalStylesheetLinkAttributes({
  linkNode,
  styleNode
}: {
  linkNode: HTMLLinkElement;
  styleNode: HTMLStyleElement;
}) {
  const media = String(linkNode.getAttribute('media') || '').trim();
  if (media) {
    styleNode.setAttribute('media', media);
  }
  const title = String(linkNode.getAttribute('title') || '').trim();
  if (title) {
    styleNode.setAttribute('title', title);
  }
  const nonce = String(linkNode.getAttribute('nonce') || '').trim();
  if (nonce) {
    styleNode.setAttribute('nonce', nonce);
  }
  if (linkNode.hasAttribute('disabled')) {
    styleNode.setAttribute('disabled', '');
  }
  const id = String(linkNode.getAttribute('id') || '').trim();
  if (id) {
    styleNode.setAttribute('id', id);
  }
  const className = String(linkNode.getAttribute('class') || '').trim();
  if (className) {
    styleNode.setAttribute('class', className);
  }
  for (const attribute of Array.from(linkNode.attributes)) {
    const name = String(attribute?.name || '');
    const lowerName = name.toLowerCase();
    if (!lowerName.startsWith('data-') && !lowerName.startsWith('aria-')) continue;
    styleNode.setAttribute(name, String(attribute?.value || ''));
  }
}

function inlineLocalProjectAssets({
  html,
  projectFiles
}: {
  html: string;
  projectFiles: Array<{ path: string; content?: string }>;
}) {
  if (!html) return html;
  if (!Array.isArray(projectFiles) || projectFiles.length === 0) return html;

  const fileMap = new Map<string, string>();
  for (const file of projectFiles) {
    if (!file || typeof file !== 'object') continue;
    if (typeof file.content !== 'string') continue;
    const normalized = normalizeProjectFilePath(String(file.path || ''));
    if (!normalized || normalized === '/') continue;
    fileMap.set(normalized, file.content);
  }
  if (fileMap.size === 0) return html;
  const localProjectPaths = new Set<string>(fileMap.keys());
  const localProjectPathsKey = buildLocalProjectPathsKey(localProjectPaths);
  const moduleImportMap = buildLocalModuleImportMap({
    fileMap,
    localProjectPaths,
    localProjectPathsKey
  });
  const hasModuleImportMap = Object.keys(moduleImportMap).length > 0;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    let firstLocalModuleEntryScript: HTMLScriptElement | null = null;

    const scriptNodes = Array.from(doc.querySelectorAll('script'));
    for (const scriptNode of scriptNodes) {
      const scriptType = String(scriptNode.getAttribute('type') || '')
        .trim()
        .toLowerCase();
      const isModuleScript = scriptType === 'module';
      const src = scriptNode.getAttribute('src');
      const hasSrc = typeof src === 'string' && src.trim().length > 0;
      if (!hasSrc) {
        if (!isModuleScript || !hasModuleImportMap) {
          continue;
        }
        const inlineSource = String(scriptNode.textContent || '');
        const rewrittenInlineSource = rewriteLocalModuleSpecifiersToAbsolutePaths({
          source: inlineSource,
          modulePath: '/index.html',
          localProjectPaths,
          localProjectPathsKey
        });
        if (rewrittenInlineSource !== inlineSource) {
          scriptNode.textContent = rewrittenInlineSource;
        }
        if (!firstLocalModuleEntryScript) {
          firstLocalModuleEntryScript = scriptNode;
        }
        continue;
      }
      const resolvedPath = resolveLocalProjectPath(src || '');
      if (!resolvedPath) continue;
      if (isModuleScript) {
        // Keep module import resolution stable by routing local module paths
        // through an import map and preserving external module script loading
        // semantics (async/defer/ordering) via src rewrite.
        const mappedEntry = moduleImportMap[resolvedPath];
        if (!hasModuleImportMap || !mappedEntry) {
          continue;
        }
        const moduleEntryScript = scriptNode.cloneNode(false) as HTMLScriptElement;
        moduleEntryScript.setAttribute('src', mappedEntry);
        moduleEntryScript.removeAttribute('integrity');
        scriptNode.replaceWith(moduleEntryScript);
        if (!firstLocalModuleEntryScript) {
          firstLocalModuleEntryScript = moduleEntryScript;
        }
        continue;
      }
      const scriptContent = fileMap.get(resolvedPath);
      if (typeof scriptContent !== 'string') continue;
      const rawScriptType = String(scriptNode.getAttribute('type') || '').trim();
      const mimeType = rawScriptType || 'text/javascript';
      const rewrittenClassicScript = scriptNode.cloneNode(false) as HTMLScriptElement;
      rewrittenClassicScript.setAttribute(
        'src',
        buildLocalScriptDataUrl({
          source: scriptContent,
          mimeType
        })
      );
      rewrittenClassicScript.removeAttribute('integrity');
      scriptNode.replaceWith(rewrittenClassicScript);
    }
    if (firstLocalModuleEntryScript && hasModuleImportMap) {
      const importMapScript = doc.createElement('script');
      importMapScript.setAttribute('type', 'importmap');
      importMapScript.textContent = JSON.stringify({
        imports: moduleImportMap
      });
      firstLocalModuleEntryScript.before(importMapScript);
    }

    const stylesheetNodes = Array.from(
      doc.querySelectorAll('link[rel~="stylesheet"][href]')
    );
    for (const linkNode of stylesheetNodes) {
      const href = linkNode.getAttribute('href');
      const resolvedPath = resolveLocalProjectPath(href || '');
      if (!resolvedPath) continue;
      const stylesheetContent = fileMap.get(resolvedPath);
      if (typeof stylesheetContent !== 'string') continue;
      const styleNode = doc.createElement('style');
      styleNode.textContent = stylesheetContent;
      preserveLocalStylesheetLinkAttributes({
        linkNode: linkNode as HTMLLinkElement,
        styleNode
      });
      linkNode.replaceWith(styleNode);
    }

    return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
  } catch (error) {
    console.error('Failed to inline project assets for preview:', error);
    return html;
  }
}

// The Twinkle SDK script that gets injected into builds
const TWINKLE_SDK_SCRIPT = `
<script>
(function() {
  'use strict';
  if (window.Twinkle) return;

  let SQL = null;
  let db = null;
  let isInitialized = false;
  let pendingRequests = new Map();
  let requestId = 0;
  let viewerInfo = null;

  function getRequestId() {
    return 'twinkle_' + (++requestId) + '_' + Date.now();
  }

  function resolveRequestTimeoutMs(type, options) {
    const requestedTimeout = Number(options && options.timeoutMs);
    if (Number.isFinite(requestedTimeout) && requestedTimeout > 0) {
      return requestedTimeout;
    }
    if (type === 'docs:connect-start') {
      return 16 * 60 * 1000;
    }
    if (type === 'llm:generate') {
      // Backend provider retries can run up to ~15 minutes total.
      // Keep iframe timeout above that window to avoid client-side false timeouts.
      return 20 * 60 * 1000;
    }
    return 30000;
  }

  function sendRequest(type, payload, options) {
    return new Promise((resolve, reject) => {
      const id = getRequestId();
      const timeoutMs = resolveRequestTimeoutMs(type, options);
      const timeout = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error('Request timed out'));
      }, timeoutMs);

      pendingRequests.set(id, { resolve, reject, timeout });

      window.parent.postMessage({
        source: 'twinkle-build',
        id: id,
        type: type,
        payload: payload
      }, '*');
    });
  }

  function applyViewerInfo(info) {
    viewerInfo = info || null;
    if (!window.Twinkle || !window.Twinkle.viewer) return;
    const viewer = window.Twinkle.viewer;
    if (!info) {
      viewer.id = null;
      viewer.username = null;
      viewer.profilePicUrl = null;
      viewer.isLoggedIn = false;
      viewer.isOwner = false;
      return;
    }
    viewer.id = info.id || null;
    viewer.username = info.username || null;
    viewer.profilePicUrl = info.profilePicUrl || null;
    viewer.isLoggedIn = Boolean(info.isLoggedIn);
    viewer.isOwner = Boolean(info.isOwner);
  }

  window.addEventListener('message', function(event) {
    const data = event.data;
    if (!data || data.source !== 'twinkle-parent') return;

    const pending = pendingRequests.get(data.id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    pendingRequests.delete(data.id);

    if (data.error) {
      pending.reject(new Error(data.error));
    } else {
      pending.resolve(data.payload);
    }
  });

  async function loadSqlJs() {
    if (SQL) return SQL;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.min.js';
      script.onload = async () => {
        try {
          SQL = await window.initSqlJs({
            locateFile: file => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/' + file
          });
          resolve(SQL);
        } catch (err) {
          reject(err);
        }
      };
      script.onerror = () => reject(new Error('Failed to load sql.js'));
      document.head.appendChild(script);
    });
  }

  window.Twinkle = {
    db: {
      async open() {
        if (db) return db;
        await loadSqlJs();
        try {
          const response = await sendRequest('db:load', {});
          if (response && response.data) {
            const binary = atob(response.data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            db = new SQL.Database(bytes);
          } else {
            db = new SQL.Database();
          }
          isInitialized = true;
          return db;
        } catch (err) {
          console.warn('Failed to load database, creating new one:', err);
          db = new SQL.Database();
          isInitialized = true;
          return db;
        }
      },

      async save() {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        const data = db.export();
        let binary = '';
        for (let i = 0; i < data.length; i++) {
          binary += String.fromCharCode(data[i]);
        }
        const base64 = btoa(binary);
        return await sendRequest('db:save', { data: base64 });
      },

      exec(sql, params) {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        return db.exec(sql, params);
      },

      run(sql, params) {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        db.run(sql, params);
      },

      query(sql, params) {
        if (!db) throw new Error('Database not opened. Call Twinkle.db.open() first.');
        const stmt = db.prepare(sql);
        if (params) stmt.bind(params);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      },

      getDb() { return db; },
      isOpen() { return isInitialized && db !== null; },
      close() {
        if (db) { db.close(); db = null; isInitialized = false; }
      }
    },

    ai: {
      _prompts: null,

      async listPrompts() {
        if (this._prompts) return this._prompts;
        const response = await sendRequest('ai:list-prompts', {});
        this._prompts = response.prompts || [];
        return this._prompts;
      },

      async chat({ promptId, message, history }) {
        if (!promptId) throw new Error('promptId is required');
        if (!message) throw new Error('message is required');

        const response = await sendRequest('ai:chat', {
          promptId: promptId,
          message: message,
          history: history || []
        });

        return {
          text: response.response,
          prompt: response.prompt
        };
      }
    },

    viewer: {
      id: null,
      username: null,
      profilePicUrl: null,
      isLoggedIn: false,
      isOwner: false,

      async get() {
        if (viewerInfo) return viewerInfo;
        const response = await sendRequest('viewer:get', {});
        applyViewerInfo(response?.viewer);
        return viewerInfo;
      },

      async refresh() {
        viewerInfo = null;
        return await this.get();
      }
    },

    viewerDb: {
      async query(sql, params) {
        if (!sql) throw new Error('SQL is required');
        return await sendRequest('viewer-db:query', { sql: sql, params: params });
      },

      async exec(sql, params) {
        if (!sql) throw new Error('SQL is required');
        return await sendRequest('viewer-db:exec', { sql: sql, params: params });
      }
    },

    api: {
      async getCurrentUser() {
        return await this.getViewer();
      },

      async getViewer() {
        return await window.Twinkle.viewer.get();
      },

      async getUser(userId) {
        if (!userId) throw new Error('userId is required');
        const result = await sendRequest('api:get-user', { userId: userId });
        if (result?.user) return result.user;
        if (result && typeof result === 'object') return result;
        return null;
      },

      async getUsers({ search, userIds, cursor, limit } = {}) {
        return await sendRequest('api:get-users', {
          search: search,
          userIds: userIds,
          cursor: cursor,
          limit: limit
        });
      },

      async getDailyReflections({ following, userIds, lastId, cursor, limit } = {}) {
        return await sendRequest('api:get-daily-reflections', {
          following: following,
          userIds: userIds,
          lastId: lastId,
          cursor: cursor,
          limit: limit
        });
      },

      async getDailyReflectionsByUser(userId, { lastId, cursor, limit } = {}) {
        if (!userId) throw new Error('userId is required');
        return await sendRequest('api:get-daily-reflections', {
          userIds: [userId],
          lastId: lastId,
          cursor: cursor,
          limit: limit
        });
      },

      async getAICardMarketTrades({ cardId, side, since, until, cursor, limit } = {}) {
        return await sendRequest('api:get-ai-card-market-trades', {
          cardId: cardId,
          side: side,
          since: since,
          until: until,
          cursor: cursor,
          limit: limit
        });
      },

      async getAICardMarketCandles({ cardId, side, since, until, bucketSeconds, limit } = {}) {
        return await sendRequest('api:get-ai-card-market-candles', {
          cardId: cardId,
          side: side,
          since: since,
          until: until,
          bucketSeconds: bucketSeconds,
          limit: limit
        });
      }
    },

    docs: {
      async status() {
        return await sendRequest('docs:status', {});
      },

      async connect() {
        const result = await sendRequest('docs:connect-start', {}, {
          timeoutMs: 16 * 60 * 1000
        });
        return {
          success: Boolean(result?.success),
          message: result?.message || null,
          buildId: result?.buildId || null,
          connectNonce: result?.connectNonce || null
        };
      },

      async disconnect() {
        return await sendRequest('docs:disconnect', {});
      },

      async listFiles(opts) {
        var options = opts || {};
        return await sendRequest('docs:list-files', {
          query: options.query,
          pageToken: options.pageToken,
          pageSize: options.pageSize
        });
      },

      async getDoc(docId) {
        if (!docId) throw new Error('docId is required');
        return await sendRequest('docs:get-doc', { docId: docId });
      },

      async getDocText(docId) {
        if (!docId) throw new Error('docId is required');
        return await sendRequest('docs:get-doc-text', { docId: docId });
      },

      async search(query, opts) {
        if (!query) throw new Error('query is required');
        var options = opts || {};
        return await sendRequest('docs:search', {
          query: query,
          pageToken: options.pageToken,
          pageSize: options.pageSize
        });
      }
    },

    llm: {
      async listModels() {
        return await sendRequest('llm:list-models', {});
      },

      async generate(opts) {
        var options = opts || {};
        if (!options.prompt && !Array.isArray(options.messages)) {
          throw new Error('prompt or messages is required');
        }
        return await sendRequest(
          'llm:generate',
          {
            model: options.model,
            prompt: options.prompt,
            system: options.system,
            messages: options.messages,
            maxOutputTokens: options.maxOutputTokens
          },
          { timeoutMs: options.timeoutMs }
        );
      }
    },

    social: {
      async follow(userId) {
        if (!userId) throw new Error('userId is required');
        const result = await sendRequest('social:follow', { userId: userId });
        return {
          success: Boolean(result?.success),
          isFollowing:
            typeof result?.isFollowing === 'boolean'
              ? result.isFollowing
              : Boolean(result?.alreadyFollowing)
        };
      },

      async unfollow(userId) {
        if (!userId) throw new Error('userId is required');
        const result = await sendRequest('social:unfollow', { userId: userId });
        return {
          success: Boolean(result?.success),
          isFollowing:
            typeof result?.isFollowing === 'boolean'
              ? result.isFollowing
              : false
        };
      },

      async getFollowing({ limit, offset } = {}) {
        const result = await sendRequest('social:get-following', {
          limit,
          offset
        });
        if (Array.isArray(result)) return { following: result };
        return { following: Array.isArray(result?.following) ? result.following : [] };
      },

      async getFollowers({ limit, offset } = {}) {
        const result = await sendRequest('social:get-followers', {
          limit,
          offset
        });
        if (Array.isArray(result)) return { followers: result };
        return { followers: Array.isArray(result?.followers) ? result.followers : [] };
      },

      async isFollowing(userId) {
        if (!userId) throw new Error('userId is required');
        const result = await sendRequest('social:is-following', { userId: userId });
        return result?.isFollowing || false;
      }
    },

    content: {
      async getMySubjects(opts) {
        var options = opts || {};
        return await sendRequest('content:my-subjects', {
          limit: options.limit,
          cursor: options.cursor
        });
      },

      async getSubject(subjectId) {
        if (!subjectId) throw new Error('subjectId is required');
        return await sendRequest('content:subject', { subjectId: subjectId });
      },

      async getSubjectComments(subjectId, opts) {
        if (!subjectId) throw new Error('subjectId is required');
        var options = opts || {};
        return await sendRequest('content:subject-comments', {
          subjectId: subjectId,
          limit: options.limit,
          cursor: options.cursor
        });
      },

      async getProfileComments(opts) {
        var options = opts || {};
        return await sendRequest('content:profile-comments', {
          profileUserId: options.profileUserId,
          limit: options.limit,
          offset: options.offset,
          sortBy: options.sortBy,
          includeReplies: options.includeReplies,
          range: options.range,
          since: options.since,
          until: options.until
        });
      },

      async getProfileCommentIds(opts) {
        var options = opts || {};
        return await sendRequest('content:profile-comment-ids', {
          profileUserId: options.profileUserId,
          limit: options.limit,
          offset: options.offset,
          sortBy: options.sortBy,
          includeReplies: options.includeReplies,
          range: options.range,
          since: options.since,
          until: options.until
        });
      },

      async getCommentsByIds(idsOrOpts) {
        var options = Array.isArray(idsOrOpts)
          ? { ids: idsOrOpts }
          : idsOrOpts || {};
        if (!Array.isArray(options.ids)) {
          throw new Error('ids array is required');
        }
        return await sendRequest('content:profile-comments-by-ids', {
          ids: options.ids
        });
      },

      async getProfileCommentCounts(idsOrOpts) {
        var options = Array.isArray(idsOrOpts)
          ? { ids: idsOrOpts }
          : idsOrOpts || {};
        if (!Array.isArray(options.ids)) {
          throw new Error('ids array is required');
        }
        return await sendRequest('content:profile-comment-counts', {
          ids: options.ids
        });
      },

      async getProfileCommentStats(opts) {
        var options = opts || {};
        return await sendRequest('content:profile-comment-stats', {
          profileUserId: options.profileUserId,
          includeReplies: options.includeReplies,
          range: options.range,
          since: options.since,
          until: options.until
        });
      },

      async getProfileCommentCount(opts) {
        var options = opts || {};
        return await sendRequest('content:profile-comment-count', {
          profileUserId: options.profileUserId,
          includeReplies: options.includeReplies,
          range: options.range,
          since: options.since,
          until: options.until
        });
      },

      async getProfileCommentSummary(opts) {
        var options = opts || {};
        return await sendRequest('content:profile-comment-summary', {
          profileUserId: options.profileUserId,
          includeReplies: options.includeReplies,
          range: options.range,
          since: options.since,
          until: options.until
        });
      },

      async getProfileTopCommenters(opts) {
        var options = opts || {};
        return await sendRequest('content:profile-comment-top-commenters', {
          profileUserId: options.profileUserId,
          includeReplies: options.includeReplies,
          topCommentersLimit: options.topCommentersLimit,
          range: options.range,
          since: options.since,
          until: options.until
        });
      },

      async getProfileMostLikedComment(opts) {
        var options = opts || {};
        return await sendRequest('content:profile-comment-most-liked', {
          profileUserId: options.profileUserId,
          includeReplies: options.includeReplies,
          range: options.range,
          since: options.since,
          until: options.until
        });
      }
    },

    vocabulary: {
      async lookupWord(word) {
        if (!word) throw new Error('word is required');
        return await sendRequest('vocabulary:lookup-word', { word: word });
      },

      async collectWord(word) {
        if (!word) throw new Error('word is required');
        return await sendRequest('vocabulary:collect-word', { word: word });
      },

      async getBreakStatus() {
        return await sendRequest('vocabulary:break-status', {});
      },

      async getCollectedWords(opts) {
        var options = opts || {};
        return await sendRequest('vocabulary:collected-words', {
          limit: options.limit,
          cursor: options.cursor
        });
      }
    },

    sharedDb: {
      async getTopics() {
        return await sendRequest('shared-db:get-topics', {});
      },

      async createTopic(name) {
        if (!name) throw new Error('name is required');
        return await sendRequest('shared-db:create-topic', { name: name });
      },

      async getEntries(topicName, opts) {
        if (!topicName) throw new Error('topicName is required');
        var options = opts || {};
        return await sendRequest('shared-db:get-entries', {
          topicName: topicName,
          limit: options.limit,
          cursor: options.cursor
        });
      },

      async addEntry(topicName, data) {
        if (!topicName) throw new Error('topicName is required');
        if (!data) throw new Error('data is required');
        return await sendRequest('shared-db:add-entry', {
          topicName: topicName,
          data: data
        });
      },

      async updateEntry(entryId, data) {
        if (!entryId) throw new Error('entryId is required');
        if (!data) throw new Error('data is required');
        return await sendRequest('shared-db:update-entry', {
          entryId: entryId,
          data: data
        });
      },

      async deleteEntry(entryId) {
        if (!entryId) throw new Error('entryId is required');
        return await sendRequest('shared-db:delete-entry', {
          entryId: entryId
        });
      }
    },

    privateDb: {
      async get(key) {
        if (!key) throw new Error('key is required');
        return await sendRequest('private-db:get', { key: key });
      },

      async list(opts) {
        var options = opts || {};
        return await sendRequest('private-db:list', {
          prefix: options.prefix,
          limit: options.limit,
          cursor: options.cursor
        });
      },

      async set(key, value) {
        if (!key) throw new Error('key is required');
        return await sendRequest('private-db:set', {
          key: key,
          value: value
        });
      },

      async remove(key) {
        if (!key) throw new Error('key is required');
        return await sendRequest('private-db:remove', { key: key });
      }
    },

    jobs: {
      async schedule(opts) {
        var options = opts || {};
        if (!options.name) throw new Error('name is required');
        if (!options.runAt) throw new Error('runAt is required');
        return await sendRequest('jobs:schedule', {
          name: options.name,
          runAt: options.runAt,
          intervalSeconds: options.intervalSeconds,
          maxRuns: options.maxRuns,
          data: options.data,
          scope: options.scope
        });
      },

      async list(opts) {
        var options = opts || {};
        return await sendRequest('jobs:list', {
          scope: options.scope,
          status: options.status,
          limit: options.limit,
          cursor: options.cursor
        });
      },

      async cancel(jobId) {
        if (!jobId) throw new Error('jobId is required');
        return await sendRequest('jobs:cancel', { jobId: jobId });
      },

      async claimDue(opts) {
        var options = opts || {};
        return await sendRequest('jobs:claim-due', {
          scope: options.scope,
          limit: options.limit
        });
      }
    },

    mail: {
      async send(opts) {
        var options = opts || {};
        if (!options.to) throw new Error('to is required');
        if (!options.subject) throw new Error('subject is required');
        return await sendRequest('mail:send', {
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
          from: options.from,
          replyTo: options.replyTo,
          meta: options.meta
        });
      },

      async list(opts) {
        var options = opts || {};
        return await sendRequest('mail:list', {
          status: options.status,
          limit: options.limit,
          cursor: options.cursor
        });
      }
    },

    build: { id: null, title: null, username: null },
    _init(info) {
      this.build.id = info.id;
      this.build.title = info.title;
      this.build.username = info.username;
      applyViewerInfo(info.viewer);
    }
  };

  sendRequest('init', {}).then(info => {
    if (info) window.Twinkle._init(info);
  }).catch(() => {});

  console.log('Twinkle SDK loaded');
})();
</script>
`;

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const panelClass = css`
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  background: #fff;
  gap: 0;
  overflow: hidden;
`;

const toolbarClass = css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  min-height: var(--build-workspace-header-height);
  padding: 0 1rem;
  column-gap: 0.75rem;
  background: #fff;
  border-bottom: 1px solid var(--ui-border);
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    row-gap: 0.65rem;
    padding: 0.9rem 1rem;
  }
`;

const toolbarTitleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 900;
  color: var(--chat-text);
  font-size: 1.2rem;
  font-family: ${displayFontFamily};
`;

const toolbarActionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

const previewStageClass = css`
  position: relative;
  width: 100%;
  height: 100%;
  background: #fff;
  overflow: hidden;
`;

const previewPreloadSurfaceClass = css`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  background: #fafbff;
  color: var(--chat-text);
  z-index: 1;
`;

const previewPreloadIconWrapClass = css`
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.9);
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const previewPreloadLabelClass = css`
  font-size: 0.82rem;
  font-weight: 700;
  opacity: 0.82;
`;

const previewIframeClass = css`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  transition: opacity 0.18s ease;
`;

const previewLoadingOverlayClass = css`
  position: absolute;
  right: 0.9rem;
  bottom: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--ui-border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--chat-text);
  font-size: 0.8rem;
  font-weight: 700;
  z-index: 4;
  backdrop-filter: blur(1px);
`;

const previewSpinnerClass = css`
  animation: previewSpin 0.9s linear infinite;
  @keyframes previewSpin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const versionRowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--ui-border);
`;

const versionMetaClass = css`
  font-size: 0.8rem;
  color: var(--chat-text);
  opacity: 0.6;
  margin-top: 0.2rem;
`;

const historyModalShellClass = css`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const historyModalHeaderClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--ui-border);
  background: #fff;
`;

const historyModalTitleClass = css`
  font-weight: 700;
  color: var(--chat-text);
  font-size: 1.1rem;
`;

const historyModalCloseButtonClass = css`
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--ui-border);
  background: #fff;
  color: var(--chat-text);
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
  &:hover {
    background: var(--chat-bg);
    border-color: var(--theme-border);
  }
  &:focus-visible {
    outline: 2px solid var(--theme-border);
    outline-offset: 2px;
  }
`;

const historyModalContentClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem 1.25rem;
`;

const workspaceViewOptions = [
  { value: 'preview', label: 'Preview', icon: 'eye' },
  { value: 'code', label: 'Code', icon: 'code' }
] as const;

export default function PreviewPanel({
  build,
  code,
  projectFiles,
  isOwner,
  onReplaceCode,
  onApplyRestoredProjectFiles,
  onSaveProjectFiles,
  onEditableProjectFilesStateChange
}: PreviewPanelProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [activePreviewFrame, setActivePreviewFrame] = useState<
    'primary' | 'secondary'
  >('primary');
  const [previewFrameSources, setPreviewFrameSources] = useState<{
    primary: string | null;
    secondary: string | null;
  }>({
    primary: null,
    secondary: null
  });
  const [previewFrameReady, setPreviewFrameReady] = useState<{
    primary: boolean;
    secondary: boolean;
  }>({
    primary: false,
    secondary: false
  });
  const [previewTransitioning, setPreviewTransitioning] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [versions, setVersions] = useState<ArtifactVersion[]>([]);
  const [restoringVersionId, setRestoringVersionId] = useState<number | null>(
    null
  );
  const [artifactId, setArtifactId] = useState<number | null>(
    build.primaryArtifactId ?? null
  );
  const [editableProjectFiles, setEditableProjectFiles] = useState<
    EditableProjectFile[]
  >(() => buildEditableProjectFiles({ code, projectFiles }));
  const deferredPreviewProjectFiles = useDeferredValue(editableProjectFiles);
  const [activeFilePath, setActiveFilePath] = useState('/index.html');
  const [newFilePath, setNewFilePath] = useState('');
  const [renamePathInput, setRenamePathInput] = useState('/index.html');
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(
    null
  );
  const [folderMoveTargetPath, setFolderMoveTargetPath] = useState('');
  const [overwritePathConflicts, setOverwritePathConflicts] = useState(false);
  const [pathConflictList, setPathConflictList] = useState<string[]>([]);
  const [collapsedFolders, setCollapsedFolders] = useState<
    Record<string, boolean>
  >({});
  const [savingProjectFiles, setSavingProjectFiles] = useState(false);
  const [projectFileError, setProjectFileError] = useState('');
  const primaryIframeRef = useRef<HTMLIFrameElement>(null);
  const secondaryIframeRef = useRef<HTMLIFrameElement>(null);
  const activePreviewFrameRef = useRef<'primary' | 'secondary'>('primary');
  const messageTargetFrameRef = useRef<'primary' | 'secondary'>('primary');
  const previewTransitioningRef = useRef(false);
  const previewFrameMetaRef = useRef<{
    primary: PreviewFrameMeta;
    secondary: PreviewFrameMeta;
  }>({
    primary: { buildId: null, codeSignature: null },
    secondary: { buildId: null, codeSignature: null }
  });
  const previewFrameSourcesRef = useRef<{
    primary: string | null;
    secondary: string | null;
  }>({
    primary: null,
    secondary: null
  });
  const previewFrameReadyRef = useRef<{
    primary: boolean;
    secondary: boolean;
  }>({
    primary: false,
    secondary: false
  });
  const buildRef = useRef(build);
  const isOwnerRef = useRef(isOwner);
  const userIdRef = useRef<number | null>(null);
  const usernameRef = useRef<string | null>(null);
  const profilePicUrlRef = useRef<string | null>(null);
  const missionProgressRef = useRef({
    promptListUsed: false,
    aiChatUsed: false,
    dbUsed: false
  });

  const persistedProjectFiles = useMemo(
    () => buildEditableProjectFiles({ code, projectFiles }),
    [code, projectFiles]
  );
  const persistedProjectFilesSignature = useMemo(
    () => serializeEditableProjectFiles(persistedProjectFiles),
    [persistedProjectFiles]
  );
  const editableProjectFilesSignature = useMemo(
    () => serializeEditableProjectFiles(editableProjectFiles),
    [editableProjectFiles]
  );
  const hasUnsavedProjectFileChanges =
    editableProjectFilesSignature !== persistedProjectFilesSignature;
  const editableProjectFilesForParent = useMemo(
    () =>
      editableProjectFiles.map((file) => ({
        path: file.path,
        content: file.content
      })),
    [editableProjectFiles]
  );
  const activeFile = useMemo(
    () =>
      editableProjectFiles.find((file) => file.path === activeFilePath) || null,
    [editableProjectFiles, activeFilePath]
  );
  const persistedFileContentByPath = useMemo(() => {
    const byPath = new Map<string, string>();
    for (const file of persistedProjectFiles) {
      byPath.set(file.path, file.content);
    }
    return byPath;
  }, [persistedProjectFiles]);
  const projectExplorerEntries = useMemo(
    () =>
      buildProjectExplorerEntries({
        files: editableProjectFiles,
        collapsedFolders
      }),
    [editableProjectFiles, collapsedFolders]
  );

  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  const missions = useKeyContext((v) => v.myState.missions);
  const buildMissionState = missions?.build || {};
  const promptListUsed = Boolean(buildMissionState.promptListUsed);
  const aiChatUsed = Boolean(buildMissionState.aiChatUsed);
  const dbUsed = Boolean(buildMissionState.dbUsed);

  const downloadBuildDatabase = useAppContext(
    (v) => v.requestHelpers.downloadBuildDatabase
  );
  const uploadBuildDatabase = useAppContext(
    (v) => v.requestHelpers.uploadBuildDatabase
  );
  const loadBuildAiPrompts = useAppContext(
    (v) => v.requestHelpers.loadBuildAiPrompts
  );
  const callBuildAiChat = useAppContext(
    (v) => v.requestHelpers.callBuildAiChat
  );
  const listBuildArtifacts = useAppContext(
    (v) => v.requestHelpers.listBuildArtifacts
  );
  const listBuildArtifactVersions = useAppContext(
    (v) => v.requestHelpers.listBuildArtifactVersions
  );
  const restoreBuildArtifactVersion = useAppContext(
    (v) => v.requestHelpers.restoreBuildArtifactVersion
  );
  const followBuildUser = useAppContext(
    (v) => v.requestHelpers.followBuildUser
  );
  const unfollowBuildUser = useAppContext(
    (v) => v.requestHelpers.unfollowBuildUser
  );
  const loadBuildFollowers = useAppContext(
    (v) => v.requestHelpers.loadBuildFollowers
  );
  const loadBuildFollowing = useAppContext(
    (v) => v.requestHelpers.loadBuildFollowing
  );
  const isFollowingBuildUser = useAppContext(
    (v) => v.requestHelpers.isFollowingBuildUser
  );
  const queryViewerDb = useAppContext((v) => v.requestHelpers.queryViewerDb);
  const execViewerDb = useAppContext((v) => v.requestHelpers.execViewerDb);
  const getBuildApiToken = useAppContext(
    (v) => v.requestHelpers.getBuildApiToken
  );
  const getBuildApiUser = useAppContext(
    (v) => v.requestHelpers.getBuildApiUser
  );
  const getBuildApiUsers = useAppContext(
    (v) => v.requestHelpers.getBuildApiUsers
  );
  const getBuildDailyReflections = useAppContext(
    (v) => v.requestHelpers.getBuildDailyReflections
  );
  const getBuildAICardMarketTrades = useAppContext(
    (v) => v.requestHelpers.getBuildAICardMarketTrades
  );
  const getBuildAICardMarketCandles = useAppContext(
    (v) => v.requestHelpers.getBuildAICardMarketCandles
  );
  const getBuildDocsStatus = useAppContext(
    (v) => v.requestHelpers.getBuildDocsStatus
  );
  const startBuildDocsConnect = useAppContext(
    (v) => v.requestHelpers.startBuildDocsConnect
  );
  const disconnectBuildDocs = useAppContext(
    (v) => v.requestHelpers.disconnectBuildDocs
  );
  const listBuildDocsFiles = useAppContext(
    (v) => v.requestHelpers.listBuildDocsFiles
  );
  const getBuildDoc = useAppContext((v) => v.requestHelpers.getBuildDoc);
  const getBuildDocText = useAppContext(
    (v) => v.requestHelpers.getBuildDocText
  );
  const searchBuildDocs = useAppContext(
    (v) => v.requestHelpers.searchBuildDocs
  );
  const listBuildLlmModels = useAppContext(
    (v) => v.requestHelpers.listBuildLlmModels
  );
  const generateBuildLlmResponse = useAppContext(
    (v) => v.requestHelpers.generateBuildLlmResponse
  );
  const lookupBuildVocabularyWord = useAppContext(
    (v) => v.requestHelpers.lookupBuildVocabularyWord
  );
  const collectBuildVocabularyWord = useAppContext(
    (v) => v.requestHelpers.collectBuildVocabularyWord
  );
  const getBuildVocabularyBreakStatus = useAppContext(
    (v) => v.requestHelpers.getBuildVocabularyBreakStatus
  );
  const getBuildCollectedVocabularyWords = useAppContext(
    (v) => v.requestHelpers.getBuildCollectedVocabularyWords
  );
  const getBuildMySubjects = useAppContext(
    (v) => v.requestHelpers.getBuildMySubjects
  );
  const getBuildSubject = useAppContext(
    (v) => v.requestHelpers.getBuildSubject
  );
  const getBuildSubjectComments = useAppContext(
    (v) => v.requestHelpers.getBuildSubjectComments
  );
  const getBuildProfileComments = useAppContext(
    (v) => v.requestHelpers.getBuildProfileComments
  );
  const getBuildProfileCommentIds = useAppContext(
    (v) => v.requestHelpers.getBuildProfileCommentIds
  );
  const getBuildProfileCommentsByIds = useAppContext(
    (v) => v.requestHelpers.getBuildProfileCommentsByIds
  );
  const getBuildProfileCommentCounts = useAppContext(
    (v) => v.requestHelpers.getBuildProfileCommentCounts
  );
  const getBuildProfileCommentStats = useAppContext(
    (v) => v.requestHelpers.getBuildProfileCommentStats
  );
  const getBuildProfileCommentCount = useAppContext(
    (v) => v.requestHelpers.getBuildProfileCommentCount
  );
  const getBuildProfileCommentSummary = useAppContext(
    (v) => v.requestHelpers.getBuildProfileCommentSummary
  );
  const getBuildProfileTopCommenters = useAppContext(
    (v) => v.requestHelpers.getBuildProfileTopCommenters
  );
  const getBuildProfileMostLikedComment = useAppContext(
    (v) => v.requestHelpers.getBuildProfileMostLikedComment
  );
  const getSharedDbTopics = useAppContext(
    (v) => v.requestHelpers.getSharedDbTopics
  );
  const createSharedDbTopic = useAppContext(
    (v) => v.requestHelpers.createSharedDbTopic
  );
  const getSharedDbEntries = useAppContext(
    (v) => v.requestHelpers.getSharedDbEntries
  );
  const addSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.addSharedDbEntry
  );
  const updateSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.updateSharedDbEntry
  );
  const deleteSharedDbEntry = useAppContext(
    (v) => v.requestHelpers.deleteSharedDbEntry
  );
  const getPrivateDbItem = useAppContext(
    (v) => v.requestHelpers.getPrivateDbItem
  );
  const listPrivateDbItems = useAppContext(
    (v) => v.requestHelpers.listPrivateDbItems
  );
  const setPrivateDbItem = useAppContext(
    (v) => v.requestHelpers.setPrivateDbItem
  );
  const deletePrivateDbItem = useAppContext(
    (v) => v.requestHelpers.deletePrivateDbItem
  );
  const scheduleBuildJob = useAppContext(
    (v) => v.requestHelpers.scheduleBuildJob
  );
  const listBuildJobs = useAppContext((v) => v.requestHelpers.listBuildJobs);
  const cancelBuildJob = useAppContext((v) => v.requestHelpers.cancelBuildJob);
  const claimDueBuildJobs = useAppContext(
    (v) => v.requestHelpers.claimDueBuildJobs
  );
  const sendBuildMail = useAppContext((v) => v.requestHelpers.sendBuildMail);
  const listBuildMail = useAppContext((v) => v.requestHelpers.listBuildMail);
  const updateMissionStatus = useAppContext(
    (v) => v.requestHelpers.updateMissionStatus
  );
  const onUpdateUserMissionState = useAppContext(
    (v) => v.user.actions.onUpdateUserMissionState
  );

  const downloadBuildDatabaseRef = useRef(downloadBuildDatabase);
  const uploadBuildDatabaseRef = useRef(uploadBuildDatabase);
  const loadBuildAiPromptsRef = useRef(loadBuildAiPrompts);
  const callBuildAiChatRef = useRef(callBuildAiChat);
  const listBuildArtifactsRef = useRef(listBuildArtifacts);
  const listBuildArtifactVersionsRef = useRef(listBuildArtifactVersions);
  const restoreBuildArtifactVersionRef = useRef(restoreBuildArtifactVersion);
  const followBuildUserRef = useRef(followBuildUser);
  const unfollowBuildUserRef = useRef(unfollowBuildUser);
  const loadBuildFollowersRef = useRef(loadBuildFollowers);
  const loadBuildFollowingRef = useRef(loadBuildFollowing);
  const isFollowingBuildUserRef = useRef(isFollowingBuildUser);
  const queryViewerDbRef = useRef(queryViewerDb);
  const execViewerDbRef = useRef(execViewerDb);
  const getBuildApiTokenRef = useRef(getBuildApiToken);
  const getBuildApiUserRef = useRef(getBuildApiUser);
  const getBuildApiUsersRef = useRef(getBuildApiUsers);
  const getBuildDailyReflectionsRef = useRef(getBuildDailyReflections);
  const getBuildAICardMarketTradesRef = useRef(getBuildAICardMarketTrades);
  const getBuildAICardMarketCandlesRef = useRef(getBuildAICardMarketCandles);
  const getBuildDocsStatusRef = useRef(getBuildDocsStatus);
  const startBuildDocsConnectRef = useRef(startBuildDocsConnect);
  const disconnectBuildDocsRef = useRef(disconnectBuildDocs);
  const listBuildDocsFilesRef = useRef(listBuildDocsFiles);
  const getBuildDocRef = useRef(getBuildDoc);
  const getBuildDocTextRef = useRef(getBuildDocText);
  const searchBuildDocsRef = useRef(searchBuildDocs);
  const listBuildLlmModelsRef = useRef(listBuildLlmModels);
  const generateBuildLlmResponseRef = useRef(generateBuildLlmResponse);
  const lookupBuildVocabularyWordRef = useRef(lookupBuildVocabularyWord);
  const collectBuildVocabularyWordRef = useRef(collectBuildVocabularyWord);
  const getBuildVocabularyBreakStatusRef = useRef(
    getBuildVocabularyBreakStatus
  );
  const getBuildCollectedVocabularyWordsRef = useRef(
    getBuildCollectedVocabularyWords
  );
  const getBuildMySubjectsRef = useRef(getBuildMySubjects);
  const getBuildSubjectRef = useRef(getBuildSubject);
  const getBuildSubjectCommentsRef = useRef(getBuildSubjectComments);
  const getBuildProfileCommentsRef = useRef(getBuildProfileComments);
  const getBuildProfileCommentIdsRef = useRef(getBuildProfileCommentIds);
  const getBuildProfileCommentsByIdsRef = useRef(getBuildProfileCommentsByIds);
  const getBuildProfileCommentCountsRef = useRef(getBuildProfileCommentCounts);
  const getBuildProfileCommentStatsRef = useRef(getBuildProfileCommentStats);
  const getBuildProfileCommentCountRef = useRef(getBuildProfileCommentCount);
  const getBuildProfileCommentSummaryRef = useRef(getBuildProfileCommentSummary);
  const getBuildProfileTopCommentersRef = useRef(getBuildProfileTopCommenters);
  const getBuildProfileMostLikedCommentRef = useRef(
    getBuildProfileMostLikedComment
  );
  const getSharedDbTopicsRef = useRef(getSharedDbTopics);
  const createSharedDbTopicRef = useRef(createSharedDbTopic);
  const getSharedDbEntriesRef = useRef(getSharedDbEntries);
  const addSharedDbEntryRef = useRef(addSharedDbEntry);
  const updateSharedDbEntryRef = useRef(updateSharedDbEntry);
  const deleteSharedDbEntryRef = useRef(deleteSharedDbEntry);
  const getPrivateDbItemRef = useRef(getPrivateDbItem);
  const listPrivateDbItemsRef = useRef(listPrivateDbItems);
  const setPrivateDbItemRef = useRef(setPrivateDbItem);
  const deletePrivateDbItemRef = useRef(deletePrivateDbItem);
  const scheduleBuildJobRef = useRef(scheduleBuildJob);
  const listBuildJobsRef = useRef(listBuildJobs);
  const cancelBuildJobRef = useRef(cancelBuildJob);
  const claimDueBuildJobsRef = useRef(claimDueBuildJobs);
  const sendBuildMailRef = useRef(sendBuildMail);
  const listBuildMailRef = useRef(listBuildMail);
  const updateMissionStatusRef = useRef(updateMissionStatus);
  const onUpdateUserMissionStateRef = useRef(onUpdateUserMissionState);

  const buildApiTokenRef = useRef<{
    token: string;
    scopes: string[];
    expiresAt: number;
  } | null>(null);
  const docsConnectInFlightRef = useRef<PendingDocsConnectRequest | null>(null);
  const docsConnectPopupRef = useRef<Window | null>(null);
  const hydratedBuildIdRef = useRef<number | null>(null);

  // Inject SDK into user code
  const codeWithSdk = useMemo(() => {
    const indexFile = getPreferredIndexFile(deferredPreviewProjectFiles);
    const hasIndexFile = Boolean(indexFile);
    const runtimeIndexHtml = hasIndexFile
      ? indexFile?.content ?? ''
      : String(code || '');
    if (!hasIndexFile && runtimeIndexHtml.length === 0) return null;
    const htmlWithInlinedAssets = inlineLocalProjectAssets({
      html: runtimeIndexHtml,
      projectFiles: deferredPreviewProjectFiles
    });

    // Insert SDK script right after <head> tag
    if (htmlWithInlinedAssets.includes('<head>')) {
      return htmlWithInlinedAssets.replace(
        '<head>',
        '<head>' + TWINKLE_SDK_SCRIPT
      );
    }

    // If no head tag, insert before first script or at start of body
    if (htmlWithInlinedAssets.includes('<body>')) {
      return htmlWithInlinedAssets.replace(
        '<body>',
        '<body>' + TWINKLE_SDK_SCRIPT
      );
    }

    // Fallback: prepend to entire code
    return TWINKLE_SDK_SCRIPT + htmlWithInlinedAssets;
  }, [code, deferredPreviewProjectFiles]);

  const previewSrc = useMemo(() => {
    if (!codeWithSdk) return null;
    const blob = new Blob([codeWithSdk], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [codeWithSdk]);
  const previewCodeSignature = useMemo(
    () => buildPreviewCodeSignature(codeWithSdk),
    [codeWithSdk]
  );

  useEffect(() => {
    const activeFrame = activePreviewFrameRef.current;
    const inactiveFrame = activeFrame === 'primary' ? 'secondary' : 'primary';
    const currentSources = previewFrameSourcesRef.current;
    let activeSrc = currentSources[activeFrame];
    let inactiveSrc = currentSources[inactiveFrame];
    let seededFromCache = false;

    if (!activeSrc && !inactiveSrc && previewCodeSignature) {
      const cached = takeCachedPreviewSeed(build.id, previewCodeSignature);
      if (cached?.src) {
        const seededSources = {
          ...currentSources,
          [activeFrame]: cached.src
        };
        previewFrameSourcesRef.current = seededSources;
        setPreviewFrameSources(seededSources);
        const seededMeta = {
          ...previewFrameMetaRef.current,
          [activeFrame]: {
            buildId: build.id,
            codeSignature: cached.codeSignature || previewCodeSignature
          }
        };
        previewFrameMetaRef.current = seededMeta;
        const seededReady = {
          ...previewFrameReadyRef.current,
          [activeFrame]: false
        };
        previewFrameReadyRef.current = seededReady;
        setPreviewFrameReady(seededReady);
        activeSrc = cached.src;
        messageTargetFrameRef.current = activeFrame;
        seededFromCache = true;
      }
    }

    if (!previewSrc) {
      clearCachedPreviewSeed(build.id);
      if (currentSources.primary) {
        URL.revokeObjectURL(currentSources.primary);
      }
      if (
        currentSources.secondary &&
        currentSources.secondary !== currentSources.primary
      ) {
        URL.revokeObjectURL(currentSources.secondary);
      }
      const cleared = { primary: null, secondary: null };
      previewFrameSourcesRef.current = cleared;
      setPreviewFrameSources(cleared);
      previewFrameMetaRef.current = {
        primary: { buildId: null, codeSignature: null },
        secondary: { buildId: null, codeSignature: null }
      };
      const clearedReady = { primary: false, secondary: false };
      previewFrameReadyRef.current = clearedReady;
      setPreviewFrameReady(clearedReady);
      messageTargetFrameRef.current = activeFrame;
      previewTransitioningRef.current = false;
      setPreviewTransitioning(false);
      return;
    }

    if (seededFromCache) {
      URL.revokeObjectURL(previewSrc);
      previewTransitioningRef.current = false;
      setPreviewTransitioning(false);
      return;
    }

    if (!activeSrc) {
      const nextSources = {
        ...currentSources,
        [activeFrame]: previewSrc
      };
      previewFrameSourcesRef.current = nextSources;
      setPreviewFrameSources(nextSources);
      const nextMeta = {
        ...previewFrameMetaRef.current,
        [activeFrame]: {
          buildId: build.id,
          codeSignature: previewCodeSignature
        }
      };
      previewFrameMetaRef.current = nextMeta;
      const nextReady = {
        ...previewFrameReadyRef.current,
        [activeFrame]: false
      };
      previewFrameReadyRef.current = nextReady;
      setPreviewFrameReady(nextReady);
      messageTargetFrameRef.current = activeFrame;
      previewTransitioningRef.current = true;
      setPreviewTransitioning(true);
      return;
    }

    if (previewSrc === activeSrc || previewSrc === inactiveSrc) {
      const reusedFrame =
        previewSrc === activeSrc ? activeFrame : inactiveFrame;
      const currentMeta = previewFrameMetaRef.current[reusedFrame];
      const nextSignature = previewCodeSignature || currentMeta?.codeSignature;
      if (
        currentMeta?.buildId !== build.id ||
        currentMeta?.codeSignature !== nextSignature
      ) {
        previewFrameMetaRef.current = {
          ...previewFrameMetaRef.current,
          [reusedFrame]: {
            buildId: build.id,
            codeSignature: nextSignature
          }
        };
      }
      return;
    }

    if (inactiveSrc && inactiveSrc !== previewSrc) {
      URL.revokeObjectURL(inactiveSrc);
    }

    const nextSources = {
      ...currentSources,
      [inactiveFrame]: previewSrc
    };
    previewFrameSourcesRef.current = nextSources;
    setPreviewFrameSources(nextSources);
    const nextMeta = {
      ...previewFrameMetaRef.current,
      [inactiveFrame]: {
        buildId: build.id,
        codeSignature: previewCodeSignature
      }
    };
    previewFrameMetaRef.current = nextMeta;
    const nextReady = {
      ...previewFrameReadyRef.current,
      [inactiveFrame]: false
    };
    previewFrameReadyRef.current = nextReady;
    setPreviewFrameReady(nextReady);
    messageTargetFrameRef.current = activeFrame;
    previewTransitioningRef.current = true;
    setPreviewTransitioning(true);
  }, [build.id, previewCodeSignature, previewSrc]);

  useEffect(() => {
    activePreviewFrameRef.current = activePreviewFrame;
  }, [activePreviewFrame]);

  useEffect(() => {
    previewFrameSourcesRef.current = previewFrameSources;
  }, [previewFrameSources]);

  useEffect(() => {
    previewFrameReadyRef.current = previewFrameReady;
  }, [previewFrameReady]);

  useEffect(() => {
    previewTransitioningRef.current = previewTransitioning;
  }, [previewTransitioning]);

  useEffect(() => {
    return () => {
      const activeFrame = activePreviewFrameRef.current;
      const sources = previewFrameSourcesRef.current;
      const ready = previewFrameReadyRef.current;
      const frameMeta = previewFrameMetaRef.current;
      const activeMeta = frameMeta[activeFrame];
      const activeSrc = sources[activeFrame];
      const shouldCacheActive =
        Boolean(activeSrc) &&
        ready[activeFrame] &&
        Boolean(activeMeta?.codeSignature) &&
        activeMeta?.buildId === buildRef.current?.id;

      if (
        shouldCacheActive &&
        activeSrc &&
        activeMeta?.buildId &&
        activeMeta?.codeSignature
      ) {
        putCachedPreviewSeed({
          buildId: activeMeta.buildId,
          codeSignature: activeMeta.codeSignature,
          src: activeSrc,
          cachedAt: Date.now()
        });
      } else if (activeSrc) {
        URL.revokeObjectURL(activeSrc);
      }

      if (sources.primary && sources.primary !== activeSrc) {
        URL.revokeObjectURL(sources.primary);
      }
      if (sources.secondary && sources.secondary !== sources.primary) {
        if (sources.secondary !== activeSrc) {
          URL.revokeObjectURL(sources.secondary);
        }
      }
    };
  }, []);

  useEffect(() => {
    buildRef.current = build;
  }, [build]);

  useEffect(() => {
    setArtifactId(build.primaryArtifactId ?? null);
  }, [build.primaryArtifactId]);

  useEffect(() => {
    isOwnerRef.current = isOwner;
  }, [isOwner]);

  useEffect(() => {
    userIdRef.current = userId || null;
  }, [userId]);

  useEffect(() => {
    usernameRef.current = username || null;
  }, [username]);

  useEffect(() => {
    profilePicUrlRef.current = profilePicUrl || null;
  }, [profilePicUrl]);

  useEffect(() => {
    const shouldHydrateForBuild =
      hydratedBuildIdRef.current === null || hydratedBuildIdRef.current !== build.id;
    if (!shouldHydrateForBuild) return;
    hydratedBuildIdRef.current = build.id;
    setEditableProjectFiles(persistedProjectFiles);
    setActiveFilePath(
      getPreferredIndexPath(persistedProjectFiles) ||
        persistedProjectFiles[0]?.path ||
        '/index.html'
    );
    setProjectFileError('');
    setNewFilePath('');
    setRenamePathInput('/index.html');
    setSelectedFolderPath(null);
    setFolderMoveTargetPath('');
    setOverwritePathConflicts(false);
    setPathConflictList([]);
    setCollapsedFolders({});
  }, [build.id, persistedProjectFiles, persistedProjectFilesSignature]);

  useEffect(() => {
    if (hasUnsavedProjectFileChanges) return;
    setEditableProjectFiles(persistedProjectFiles);
    setActiveFilePath((prev) => {
      const hasPrev = persistedProjectFiles.some((file) => file.path === prev);
      if (hasPrev) return prev;
      return (
        getPreferredIndexPath(persistedProjectFiles) ||
        persistedProjectFiles[0]?.path ||
        '/index.html'
      );
    });
  }, [
    persistedProjectFiles,
    persistedProjectFilesSignature,
    hasUnsavedProjectFileChanges
  ]);

  useEffect(() => {
    onEditableProjectFilesStateChange?.({
      files: editableProjectFilesForParent,
      hasUnsavedChanges: hasUnsavedProjectFileChanges,
      saving: savingProjectFiles
    });
  }, [
    editableProjectFilesForParent,
    hasUnsavedProjectFileChanges,
    savingProjectFiles,
    onEditableProjectFilesStateChange
  ]);

  useEffect(() => {
    setRenamePathInput(activeFile?.path || '/index.html');
  }, [activeFile?.path]);

  useEffect(() => {
    if (!selectedFolderPath) {
      setFolderMoveTargetPath('');
      return;
    }
    setFolderMoveTargetPath(selectedFolderPath);
  }, [selectedFolderPath]);

  function setEditableFiles(nextFiles: EditableProjectFile[]) {
    const sorted = [...nextFiles].sort((a, b) => a.path.localeCompare(b.path));
    setEditableProjectFiles(sorted);
    setActiveFilePath((prev) => {
      if (sorted.some((file) => file.path === prev)) return prev;
      return (
        getPreferredIndexPath(sorted) ||
        sorted[0]?.path ||
        '/index.html'
      );
    });
  }

  function toggleFolderCollapsed(folderPath: string) {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  }

  function handleSelectFolder(folderPath: string) {
    setSelectedFolderPath(folderPath);
    setProjectFileError('');
    setPathConflictList([]);
  }

  function handleEditableFileContentChange(content: string) {
    if (!isOwner || !activeFile) return;
    setEditableFiles(
      editableProjectFiles.map((file) =>
        file.path === activeFile.path ? { ...file, content } : file
      )
    );
    setProjectFileError('');
    setPathConflictList([]);
  }

  function handleAddProjectFile() {
    if (!isOwner) return;
    const normalizedPath = normalizeProjectFilePath(newFilePath);
    if (
      !normalizedPath ||
      normalizedPath === '/' ||
      normalizedPath.endsWith('/')
    ) {
      setProjectFileError('Enter a valid file path like /src/app.js');
      return;
    }
    if (editableProjectFiles.some((file) => file.path === normalizedPath)) {
      setProjectFileError('A file with this path already exists');
      return;
    }
    const nextFiles = [
      ...editableProjectFiles,
      { path: normalizedPath, content: '' }
    ];
    setEditableFiles(nextFiles);
    setActiveFilePath(normalizedPath);
    setSelectedFolderPath(null);
    setNewFilePath('');
    setProjectFileError('');
    setPathConflictList([]);
  }

  function handleDeleteProjectFile(filePath: string) {
    if (!isOwner) return;
    if (isIndexHtmlPath(filePath)) {
      setProjectFileError('Cannot delete /index.html');
      return;
    }
    const nextFiles = editableProjectFiles.filter((file) => file.path !== filePath);
    if (nextFiles.length === editableProjectFiles.length) return;
    if (!window.confirm(`Delete ${filePath}?`)) return;
    setEditableFiles(nextFiles);
    setProjectFileError('');
    setPathConflictList([]);
  }

  function handleRenameOrMoveActiveFile() {
    if (!isOwner || !activeFile) return;
    const normalizedPath = normalizeProjectFilePath(renamePathInput);
    if (
      !normalizedPath ||
      normalizedPath === '/' ||
      normalizedPath.endsWith('/')
    ) {
      setProjectFileError('Enter a valid target path like /src/app.js');
      return;
    }
    const activeIsIndex = isIndexHtmlPath(activeFile.path);
    if (activeIsIndex && !isIndexHtmlPath(normalizedPath)) {
      setProjectFileError('/index.html can only be moved to /index.htm');
      return;
    }
    if (
      normalizedPath !== activeFile.path &&
      editableProjectFiles.some((file) => file.path === normalizedPath)
    ) {
      if (!overwritePathConflicts) {
        setPathConflictList([normalizedPath]);
        setProjectFileError(
          'Path conflict detected. Enable overwrite conflicts to continue.'
        );
        return;
      }
    }
    if (normalizedPath === activeFile.path) {
      setProjectFileError('');
      setPathConflictList([]);
      return;
    }
    const nextFiles = editableProjectFiles
      .filter(
        (file) =>
          !(overwritePathConflicts && file.path === normalizedPath) ||
          file.path === activeFile.path
      )
      .map((file) =>
        file.path === activeFile.path
          ? { ...file, path: normalizedPath }
          : file
      );
    setEditableFiles(nextFiles);
    setActiveFilePath(normalizedPath);
    setSelectedFolderPath(null);
    setRenamePathInput(normalizedPath);
    setProjectFileError('');
    setPathConflictList([]);
  }

  function handleMoveSelectedFolder() {
    if (!isOwner || !selectedFolderPath) return;
    const sourceFolder = normalizeProjectFilePath(selectedFolderPath);
    const targetFolder = normalizeProjectFilePath(folderMoveTargetPath);
    if (!targetFolder || targetFolder === '/') {
      setProjectFileError('Enter a valid target folder like /src/ui');
      return;
    }
    if (sourceFolder === targetFolder) {
      setProjectFileError('');
      setPathConflictList([]);
      return;
    }
    if (
      targetFolder === sourceFolder ||
      targetFolder.startsWith(`${sourceFolder}/`)
    ) {
      setProjectFileError('Cannot move a folder into itself.');
      return;
    }

    const filesInFolder = editableProjectFiles.filter((file) =>
      isPathWithinFolder(file.path, sourceFolder)
    );
    if (filesInFolder.length === 0) {
      setProjectFileError('Selected folder has no files to move.');
      return;
    }

    const movedSourcePaths = new Set(filesInFolder.map((file) => file.path));
    const remappedFiles = filesInFolder.map((file) => ({
      path: remapPathPrefix({
        filePath: file.path,
        fromPrefix: sourceFolder,
        toPrefix: targetFolder
      }),
      content: file.content
    }));
    const remappedTargetPaths = new Set(remappedFiles.map((file) => file.path));
    const conflictPaths = editableProjectFiles
      .filter(
        (file) =>
          !movedSourcePaths.has(file.path) && remappedTargetPaths.has(file.path)
      )
      .map((file) => file.path)
      .sort((a, b) => a.localeCompare(b));

    if (conflictPaths.length > 0 && !overwritePathConflicts) {
      setPathConflictList(conflictPaths.slice(0, 12));
      setProjectFileError(
        `Move blocked by ${conflictPaths.length} path conflicts. Enable overwrite conflicts to continue.`
      );
      return;
    }

    const conflictSet = new Set(conflictPaths);
    const retainedFiles = editableProjectFiles.filter((file) => {
      if (movedSourcePaths.has(file.path)) return false;
      if (overwritePathConflicts && conflictSet.has(file.path)) return false;
      return true;
    });
    const merged = [...retainedFiles, ...remappedFiles];
    const deduped = new Map<string, string>();
    for (const file of merged) {
      deduped.set(file.path, file.content);
    }
    const nextFiles = Array.from(deduped.entries()).map(([path, content]) => ({
      path,
      content
    }));

    setEditableFiles(nextFiles);
    setActiveFilePath((prev) =>
      remapPathPrefix({
        filePath: prev,
        fromPrefix: sourceFolder,
        toPrefix: targetFolder
      })
    );
    setCollapsedFolders((prev) => {
      const next: Record<string, boolean> = {};
      for (const [path, value] of Object.entries(prev)) {
        if (path === sourceFolder || path.startsWith(`${sourceFolder}/`)) {
          const remappedPath = remapPathPrefix({
            filePath: path,
            fromPrefix: sourceFolder,
            toPrefix: targetFolder
          });
          next[remappedPath] = value;
        } else {
          next[path] = value;
        }
      }
      return next;
    });
    setSelectedFolderPath(targetFolder);
    setFolderMoveTargetPath(targetFolder);
    setProjectFileError('');
    setPathConflictList([]);
  }

  async function handleSaveEditableProjectFiles() {
    if (!isOwner || savingProjectFiles || !hasUnsavedProjectFileChanges) return;
    setSavingProjectFiles(true);
    setProjectFileError('');
    const result = await onSaveProjectFiles(editableProjectFiles);
    setSavingProjectFiles(false);
    if (!result?.success) {
      setProjectFileError(result?.error || 'Failed to save project files');
      return;
    }
    setProjectFileError('');
    setPathConflictList([]);
  }

  async function ensureBuildApiToken(requiredScopes: string[]) {
    const now = Math.floor(Date.now() / 1000);
    const cached = buildApiTokenRef.current;
    if (
      cached &&
      cached.expiresAt - 30 > now &&
      requiredScopes.every((scope) => cached.scopes.includes(scope))
    ) {
      return cached.token;
    }

    const activeBuild = buildRef.current;
    if (!activeBuild?.id) {
      throw new Error('Build not found');
    }

    const scopeSet = new Set<string>([
      ...(cached?.scopes || []),
      ...requiredScopes
    ]);
    const requestedScopes = Array.from(scopeSet);

    const result = await getBuildApiTokenRef.current({
      buildId: activeBuild.id,
      scopes: requestedScopes
    });
    if (!result?.token) {
      throw new Error('Failed to obtain API token');
    }
    buildApiTokenRef.current = {
      token: result.token,
      scopes: result.scopes || requestedScopes,
      expiresAt: result.expiresAt || now + 600
    };
    return result.token;
  }

  function getViewerInfo() {
    return {
      id: userIdRef.current,
      username: usernameRef.current,
      profilePicUrl: profilePicUrlRef.current,
      isLoggedIn: Boolean(userIdRef.current),
      isOwner: Boolean(isOwnerRef.current)
    };
  }

  async function startDocsConnectViaHost(
    buildId: number
  ): Promise<DocsConnectResult> {
    let popup: Window | null = null;
    try {
      popup = window.open('', 'twinkle_docs_connect', 'width=560,height=720');
    } catch {
      popup = null;
    }
    if (!popup) {
      throw new Error('Popup blocked. Please allow popups and try again.');
    }

    docsConnectPopupRef.current = popup;
    try {
      popup.document.title = 'Connect Google Docs';
      popup.document.body.innerHTML =
        '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:24px;color:#444;">Opening Google Docs authorization...</div>';
    } catch {
      // no-op
    }

    try {
      const docsReadToken = await ensureBuildApiToken(['docs:read']);
      const start = await startBuildDocsConnectRef.current({
        buildId,
        token: docsReadToken
      });
      if (!start?.url) {
        throw new Error(
          start?.error || 'Failed to start Google Docs connection'
        );
      }

      if (popup.closed) {
        throw new Error(
          'Google Docs connection window was closed before completion.'
        );
      }

      const connectNonce =
        typeof start.connectNonce === 'string' && start.connectNonce.trim()
          ? start.connectNonce.trim()
          : null;
      const timeoutMs =
        Math.max(Number(start.timeoutSeconds || 600), 60) * 1000;

      try {
        popup.location.href = start.url;
      } catch {
        throw new Error('Failed to open Google Docs authorization window.');
      }

      return await new Promise((resolve, reject) => {
        let done = false;
        let closePoll: ReturnType<typeof setInterval> | null = null;
        let timeout: ReturnType<typeof setTimeout> | null = null;

        function cleanup() {
          if (done) return;
          done = true;
          window.removeEventListener('message', handleOAuthMessage);
          if (closePoll) {
            clearInterval(closePoll);
            closePoll = null;
          }
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          if (docsConnectPopupRef.current === popup) {
            docsConnectPopupRef.current = null;
          }
        }

        function handleOAuthMessage(event: MessageEvent) {
          if (event.source !== popup) return;
          const data = event?.data;
          if (!data || data.source !== 'twinkle-build-docs-oauth') return;
          if (connectNonce) {
            const incomingNonce =
              typeof data.connectNonce === 'string' ? data.connectNonce : '';
            if (incomingNonce !== connectNonce) {
              return;
            }
          }

          const parsedBuildId = Number(data.buildId);
          cleanup();
          try {
            if (popup && !popup.closed) popup.close();
          } catch {
            // no-op
          }
          resolve({
            success: Boolean(data.success),
            message: data.message ? String(data.message) : null,
            buildId:
              Number.isFinite(parsedBuildId) && parsedBuildId > 0
                ? parsedBuildId
                : buildId,
            connectNonce:
              typeof data.connectNonce === 'string'
                ? data.connectNonce
                : connectNonce
          });
        }

        window.addEventListener('message', handleOAuthMessage);

        closePoll = setInterval(() => {
          if (!popup || popup.closed) {
            cleanup();
            reject(
              new Error(
                'Google Docs connection window was closed before completion.'
              )
            );
          }
        }, 500);

        timeout = setTimeout(() => {
          cleanup();
          try {
            if (popup && !popup.closed) popup.close();
          } catch {
            // no-op
          }
          reject(
            new Error('Google Docs connection timed out. Please try again.')
          );
        }, timeoutMs);
      });
    } catch (error) {
      if (docsConnectPopupRef.current === popup) {
        docsConnectPopupRef.current = null;
      }
      try {
        if (popup && !popup.closed) popup.close();
      } catch {
        // no-op
      }
      throw error;
    }
  }

  useEffect(() => {
    missionProgressRef.current = {
      promptListUsed,
      aiChatUsed,
      dbUsed
    };
  }, [promptListUsed, aiChatUsed, dbUsed]);

  useEffect(() => {
    return () => {
      docsConnectInFlightRef.current = null;
      const popup = docsConnectPopupRef.current;
      docsConnectPopupRef.current = null;
      try {
        if (popup && !popup.closed) popup.close();
      } catch {
        // no-op
      }
    };
  }, []);

  useEffect(() => {
    if (historyOpen) {
      void loadVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyOpen, artifactId]);

  async function loadVersions() {
    if (!isOwnerRef.current) {
      setVersions([]);
      return;
    }
    const activeBuild = buildRef.current;
    if (!activeBuild?.id) return;

    setLoadingVersions(true);
    try {
      let activeArtifactId = artifactId;
      if (!activeArtifactId) {
        const artifactsData = await listBuildArtifactsRef.current(
          activeBuild.id
        );
        activeArtifactId = artifactsData?.artifacts?.[0]?.id ?? null;
        if (activeArtifactId) {
          setArtifactId(activeArtifactId);
        }
      }

      if (!activeArtifactId) {
        setVersions([]);
        return;
      }

      const data = await listBuildArtifactVersionsRef.current({
        buildId: activeBuild.id,
        artifactId: activeArtifactId,
        limit: 50
      });
      setVersions(data?.versions || []);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setLoadingVersions(false);
    }
  }

  async function handleRestoreVersion(versionId: number) {
    if (!isOwnerRef.current || !artifactId || restoringVersionId) return;
    const activeBuild = buildRef.current;
    if (!activeBuild?.id) return;

    setRestoringVersionId(versionId);
    try {
      const result = await restoreBuildArtifactVersionRef.current({
        buildId: activeBuild.id,
        artifactId,
        versionId
      });
      const restoredProjectFiles = Array.isArray(result?.projectFiles)
        ? result.projectFiles
        : [];
      if (restoredProjectFiles.length > 0) {
        const restoredCode =
          typeof result?.code === 'string' ? result.code : null;
        onApplyRestoredProjectFiles(restoredProjectFiles, restoredCode);
        const restoredEditableFiles = buildEditableProjectFiles({
          code: restoredCode,
          projectFiles: restoredProjectFiles
        });
        setEditableProjectFiles(restoredEditableFiles);
        setActiveFilePath(
          getPreferredIndexPath(restoredEditableFiles) ||
            restoredEditableFiles[0]?.path ||
            '/index.html'
        );
        setProjectFileError('');
        setPathConflictList([]);
        setOverwritePathConflicts(false);
      } else if (result?.code) {
        onReplaceCode(result.code);
      }
      if (historyOpen) {
        await loadVersions();
      }
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
    setRestoringVersionId(null);
  }

  function handlePreviewFrameLoad(
    frame: 'primary' | 'secondary',
    expectedSrc: string | null
  ) {
    if (!expectedSrc) return;
    const sources = previewFrameSourcesRef.current;
    if (sources[frame] !== expectedSrc) return;
    const nextReadyState = {
      ...previewFrameReadyRef.current,
      [frame]: true
    };
    previewFrameReadyRef.current = nextReadyState;
    setPreviewFrameReady(nextReadyState);

    const activeFrame = activePreviewFrameRef.current;
    const inactiveFrame = activeFrame === 'primary' ? 'secondary' : 'primary';

    if (frame === activeFrame) {
      messageTargetFrameRef.current = frame;
      if (!sources[inactiveFrame]) {
        previewTransitioningRef.current = false;
        setPreviewTransitioning(false);
      }
      return;
    }

    const outgoingSrc = sources[activeFrame];
    setActivePreviewFrame(frame);
    activePreviewFrameRef.current = frame;
    messageTargetFrameRef.current = frame;
    previewTransitioningRef.current = false;
    setPreviewTransitioning(false);

    if (outgoingSrc && outgoingSrc !== expectedSrc) {
      URL.revokeObjectURL(outgoingSrc);
    }

    const nextSources = {
      ...sources,
      [activeFrame]: null
    };
    previewFrameSourcesRef.current = nextSources;
    setPreviewFrameSources(nextSources);
    const nextMeta = {
      ...previewFrameMetaRef.current,
      [activeFrame]: {
        buildId: null,
        codeSignature: null
      }
    };
    previewFrameMetaRef.current = nextMeta;
    const nextReady = {
      ...previewFrameReadyRef.current,
      [activeFrame]: false
    };
    previewFrameReadyRef.current = nextReady;
    setPreviewFrameReady(nextReady);
  }

  useEffect(() => {
    async function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.source !== 'twinkle-build') return;
      const { id, type, payload } = data;

      const sourceWindow = event.source as Window | null;
      if (!sourceWindow) return;
      const primaryWindow = primaryIframeRef.current?.contentWindow || null;
      const secondaryWindow = secondaryIframeRef.current?.contentWindow || null;
      const sourceFrame =
        primaryWindow && sourceWindow === primaryWindow
          ? 'primary'
          : secondaryWindow && sourceWindow === secondaryWindow
            ? 'secondary'
            : null;
      if (!sourceFrame) return;
      const targetFrame = messageTargetFrameRef.current;
      const targetWindow =
        targetFrame === 'primary' ? primaryWindow : secondaryWindow;
      const alternateFrame =
        targetFrame === 'primary' ? 'secondary' : 'primary';
      const alternateWindow =
        alternateFrame === 'primary' ? primaryWindow : secondaryWindow;
      const frameMeta = previewFrameMetaRef.current;
      const activeBuild = buildRef.current;
      const activeBuildId = activeBuild?.id ?? null;
      if (!activeBuildId) return;
      const targetMeta = frameMeta[targetFrame];
      const alternateMeta = frameMeta[alternateFrame];
      const alternateHasSource = Boolean(
        previewFrameSourcesRef.current[alternateFrame]
      );
      const shouldAcceptAlternate =
        previewTransitioningRef.current &&
        alternateHasSource &&
        alternateMeta?.buildId === activeBuildId;
      const fromTargetWindow = Boolean(
        targetWindow &&
        sourceWindow === targetWindow &&
        targetMeta?.buildId === activeBuildId
      );
      const fromAlternateWindow = Boolean(
        alternateWindow &&
        sourceWindow === alternateWindow &&
        alternateMeta?.buildId === activeBuildId
      );
      if (
        !fromTargetWindow &&
        !(shouldAcceptAlternate && fromAlternateWindow)
      ) {
        return;
      }

      if (
        previewTransitioningRef.current &&
        isMutatingPreviewRequestType(type)
      ) {
        const mutationAuthorityFrame = shouldAcceptAlternate
          ? alternateFrame
          : targetFrame;
        if (sourceFrame !== mutationAuthorityFrame) {
          sourceWindow.postMessage(
            {
              source: 'twinkle-parent',
              id,
              error:
                'Preview is updating. This request was skipped to prevent duplicate side effects.'
            },
            '*'
          );
          return;
        }
      }

      // SECURITY: Validate the message came from our iframe, not an external source.
      // We use '*' for postMessage origin because blob/srcdoc iframes have null origins,
      // but we validate event.source to ensure messages only come from our preview iframes.
      const owner = isOwnerRef.current;

      try {
        let response: any = {};

        switch (type) {
          case 'init':
            response = {
              id: activeBuild.id,
              title: activeBuild.title,
              username: activeBuild.username,
              viewer: getViewerInfo()
            };
            break;

          case 'db:load':
            if (!owner) {
              throw new Error('Not authorized');
            }
            const dbData = await downloadBuildDatabaseRef.current(
              activeBuild.id
            );
            if (dbData) {
              const bytes = new Uint8Array(dbData);
              let binary = '';
              for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              response = { data: btoa(binary) };
            } else {
              response = { data: null };
            }
            break;

          case 'db:save':
            if (!owner) {
              throw new Error('Not authorized');
            }
            const base64 = payload.data;
            const binaryStr = atob(base64);
            const len = binaryStr.length;
            const bytesArr = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytesArr[i] = binaryStr.charCodeAt(i);
            }
            const result = await uploadBuildDatabaseRef.current({
              buildId: activeBuild.id,
              data: bytesArr.buffer
            });
            response = result;
            break;

          case 'ai:list-prompts':
            const promptsData = await loadBuildAiPromptsRef.current();
            response = { prompts: promptsData?.prompts || [] };
            break;

          case 'ai:chat':
            if (!owner) {
              throw new Error('Not authorized');
            }
            const aiResult = await callBuildAiChatRef.current({
              buildId: activeBuild.id,
              promptId: payload.promptId,
              message: payload.message,
              history: payload.history
            });
            response = aiResult;
            break;

          case 'docs:status': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const docsReadToken = await ensureBuildApiToken(['docs:read']);
            response = await getBuildDocsStatusRef.current({
              buildId: activeBuild.id,
              token: docsReadToken
            });
            break;
          }

          case 'docs:connect-start': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const inFlightRequest = docsConnectInFlightRef.current;
            if (inFlightRequest && inFlightRequest.buildId !== activeBuild.id) {
              throw new Error(
                'A Google Docs connection is already in progress for another build.'
              );
            }

            if (!inFlightRequest) {
              const promise = startDocsConnectViaHost(activeBuild.id).finally(
                () => {
                  if (docsConnectInFlightRef.current?.promise === promise) {
                    docsConnectInFlightRef.current = null;
                  }
                }
              );
              docsConnectInFlightRef.current = {
                buildId: activeBuild.id,
                promise
              };
            }
            response = await docsConnectInFlightRef.current?.promise;
            break;
          }

          case 'docs:disconnect': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const docsWriteToken = await ensureBuildApiToken(['docs:write']);
            response = await disconnectBuildDocsRef.current({
              buildId: activeBuild.id,
              token: docsWriteToken
            });
            break;
          }

          case 'docs:list-files': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const docsReadToken = await ensureBuildApiToken(['docs:read']);
            response = await listBuildDocsFilesRef.current({
              buildId: activeBuild.id,
              query: payload?.query,
              pageToken: payload?.pageToken,
              pageSize: payload?.pageSize,
              token: docsReadToken
            });
            break;
          }

          case 'docs:get-doc': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const docsReadToken = await ensureBuildApiToken(['docs:read']);
            response = await getBuildDocRef.current({
              buildId: activeBuild.id,
              docId: payload?.docId,
              token: docsReadToken
            });
            break;
          }

          case 'docs:get-doc-text': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const docsReadToken = await ensureBuildApiToken(['docs:read']);
            response = await getBuildDocTextRef.current({
              buildId: activeBuild.id,
              docId: payload?.docId,
              token: docsReadToken
            });
            break;
          }

          case 'docs:search': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const docsReadToken = await ensureBuildApiToken(['docs:read']);
            response = await searchBuildDocsRef.current({
              buildId: activeBuild.id,
              query: payload?.query,
              pageToken: payload?.pageToken,
              pageSize: payload?.pageSize,
              token: docsReadToken
            });
            break;
          }

          case 'llm:list-models': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const llmToken = await ensureBuildApiToken(['llm:generate']);
            response = await listBuildLlmModelsRef.current({
              buildId: activeBuild.id,
              token: llmToken
            });
            break;
          }

          case 'llm:generate': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const llmToken = await ensureBuildApiToken(['llm:generate']);
            response = await generateBuildLlmResponseRef.current({
              buildId: activeBuild.id,
              model: payload?.model,
              prompt: payload?.prompt,
              system: payload?.system,
              messages: payload?.messages,
              maxOutputTokens: payload?.maxOutputTokens,
              token: llmToken
            });
            break;
          }

          case 'social:follow': {
            const targetUserId = Number(payload?.userId);
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            if (!targetUserId || Number.isNaN(targetUserId)) {
              throw new Error('userId is required');
            }
            response = await followBuildUserRef.current({
              buildId: activeBuild.id,
              userId: targetUserId
            });
            break;
          }

          case 'social:unfollow': {
            const targetUserId = Number(payload?.userId);
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            if (!targetUserId || Number.isNaN(targetUserId)) {
              throw new Error('userId is required');
            }
            response = await unfollowBuildUserRef.current({
              buildId: activeBuild.id,
              userId: targetUserId
            });
            break;
          }

          case 'social:get-followers':
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            response = await loadBuildFollowersRef.current({
              buildId: activeBuild.id,
              limit: payload?.limit,
              offset: payload?.offset
            });
            break;

          case 'social:get-following':
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            response = await loadBuildFollowingRef.current({
              buildId: activeBuild.id,
              limit: payload?.limit,
              offset: payload?.offset
            });
            break;

          case 'social:is-following': {
            const targetUserId = Number(payload?.userId);
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            if (!targetUserId || Number.isNaN(targetUserId)) {
              throw new Error('userId is required');
            }
            response = await isFollowingBuildUserRef.current({
              buildId: activeBuild.id,
              userId: targetUserId
            });
            break;
          }

          case 'viewer:get':
            response = { viewer: getViewerInfo() };
            break;

          case 'viewer-db:query':
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            response = await queryViewerDbRef.current({
              buildId: activeBuild.id,
              sql: payload?.sql,
              params: payload?.params
            });
            break;

          case 'viewer-db:exec':
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            response = await execViewerDbRef.current({
              buildId: activeBuild.id,
              sql: payload?.sql,
              params: payload?.params
            });
            break;

          case 'api:get-user': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const userToken = await ensureBuildApiToken(['user:read']);
            response = await getBuildApiUserRef.current({
              buildId: activeBuild.id,
              userId: payload?.userId,
              token: userToken
            });
            break;
          }

          case 'api:get-users': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const usersToken = await ensureBuildApiToken(['users:read']);
            response = await getBuildApiUsersRef.current({
              buildId: activeBuild.id,
              search: payload?.search,
              userIds: payload?.userIds,
              cursor: payload?.cursor,
              limit: payload?.limit,
              token: usersToken
            });
            break;
          }

          case 'api:get-daily-reflections': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const reflectionsToken = await ensureBuildApiToken([
              'dailyReflections:read'
            ]);
            response = await getBuildDailyReflectionsRef.current({
              buildId: activeBuild.id,
              following: payload?.following,
              userIds: payload?.userIds,
              lastId: payload?.lastId,
              cursor: payload?.cursor,
              limit: payload?.limit,
              token: reflectionsToken
            });
            break;
          }

          case 'api:get-ai-card-market-trades': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const aiCardsReadToken = await ensureBuildApiToken([
              'aiCards:read'
            ]);
            response = await getBuildAICardMarketTradesRef.current({
              buildId: activeBuild.id,
              cardId: payload?.cardId,
              side: payload?.side,
              since: payload?.since,
              until: payload?.until,
              cursor: payload?.cursor,
              limit: payload?.limit,
              token: aiCardsReadToken
            });
            break;
          }

          case 'api:get-ai-card-market-candles': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const aiCardsReadToken = await ensureBuildApiToken([
              'aiCards:read'
            ]);
            response = await getBuildAICardMarketCandlesRef.current({
              buildId: activeBuild.id,
              cardId: payload?.cardId,
              side: payload?.side,
              since: payload?.since,
              until: payload?.until,
              bucketSeconds: payload?.bucketSeconds,
              limit: payload?.limit,
              token: aiCardsReadToken
            });
            break;
          }

          case 'content:my-subjects': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentSubjectsToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildMySubjectsRef.current({
              buildId: activeBuild.id,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: contentSubjectsToken
            });
            break;
          }

          case 'content:subject': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentSubjectToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildSubjectRef.current({
              buildId: activeBuild.id,
              subjectId: payload?.subjectId,
              token: contentSubjectToken
            });
            break;
          }

          case 'content:subject-comments': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentCommentsToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildSubjectCommentsRef.current({
              buildId: activeBuild.id,
              subjectId: payload?.subjectId,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: contentCommentsToken
            });
            break;
          }

          case 'content:profile-comments': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentProfileCountToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildProfileCommentsRef.current({
              buildId: activeBuild.id,
              profileUserId: payload?.profileUserId,
              limit: payload?.limit,
              offset: payload?.offset,
              sortBy: payload?.sortBy,
              includeReplies: payload?.includeReplies,
              range: payload?.range,
              since: payload?.since,
              until: payload?.until,
              token: contentProfileCountToken
            });
            break;
          }

          case 'content:profile-comment-ids': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentProfileIdsToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildProfileCommentIdsRef.current({
              buildId: activeBuild.id,
              profileUserId: payload?.profileUserId,
              limit: payload?.limit,
              offset: payload?.offset,
              sortBy: payload?.sortBy,
              includeReplies: payload?.includeReplies,
              range: payload?.range,
              since: payload?.since,
              until: payload?.until,
              token: contentProfileIdsToken
            });
            break;
          }

          case 'content:profile-comments-by-ids': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentProfileByIdsToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildProfileCommentsByIdsRef.current({
              buildId: activeBuild.id,
              ids: Array.isArray(payload?.ids) ? payload.ids : [],
              token: contentProfileByIdsToken
            });
            break;
          }

          case 'content:profile-comment-counts': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentProfileCountsToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildProfileCommentCountsRef.current({
              buildId: activeBuild.id,
              ids: Array.isArray(payload?.ids) ? payload.ids : [],
              token: contentProfileCountsToken
            });
            break;
          }

          case 'content:profile-comment-stats': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentProfileStatsToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildProfileCommentStatsRef.current({
              buildId: activeBuild.id,
              profileUserId: payload?.profileUserId,
              includeReplies: payload?.includeReplies,
              range: payload?.range,
              since: payload?.since,
              until: payload?.until,
              token: contentProfileStatsToken
            });
            break;
          }

          case 'content:profile-comment-count': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentProfileCountOnlyToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildProfileCommentCountRef.current({
              buildId: activeBuild.id,
              profileUserId: payload?.profileUserId,
              includeReplies: payload?.includeReplies,
              range: payload?.range,
              since: payload?.since,
              until: payload?.until,
              token: contentProfileCountOnlyToken
            });
            break;
          }

          case 'content:profile-comment-summary': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentProfileSummaryToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildProfileCommentSummaryRef.current({
              buildId: activeBuild.id,
              profileUserId: payload?.profileUserId,
              includeReplies: payload?.includeReplies,
              range: payload?.range,
              since: payload?.since,
              until: payload?.until,
              token: contentProfileSummaryToken
            });
            break;
          }

          case 'content:profile-comment-top-commenters': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentProfileTopCommentersToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildProfileTopCommentersRef.current({
              buildId: activeBuild.id,
              profileUserId: payload?.profileUserId,
              includeReplies: payload?.includeReplies,
              topCommentersLimit: payload?.topCommentersLimit,
              range: payload?.range,
              since: payload?.since,
              until: payload?.until,
              token: contentProfileTopCommentersToken
            });
            break;
          }

          case 'content:profile-comment-most-liked': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const contentProfileMostLikedToken = await ensureBuildApiToken([
              'content:read'
            ]);
            response = await getBuildProfileMostLikedCommentRef.current({
              buildId: activeBuild.id,
              profileUserId: payload?.profileUserId,
              includeReplies: payload?.includeReplies,
              range: payload?.range,
              since: payload?.since,
              until: payload?.until,
              token: contentProfileMostLikedToken
            });
            break;
          }

          case 'vocabulary:lookup-word': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const vocabLookupToken = await ensureBuildApiToken([
              'vocabulary:read'
            ]);
            response = await lookupBuildVocabularyWordRef.current({
              buildId: activeBuild.id,
              word: payload?.word,
              token: vocabLookupToken
            });
            break;
          }

          case 'vocabulary:collect-word': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const vocabCollectToken = await ensureBuildApiToken([
              'vocabulary:write'
            ]);
            response = await collectBuildVocabularyWordRef.current({
              buildId: activeBuild.id,
              word: payload?.word,
              token: vocabCollectToken
            });
            break;
          }

          case 'vocabulary:break-status': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const vocabBreakToken = await ensureBuildApiToken([
              'vocabulary:read'
            ]);
            response = await getBuildVocabularyBreakStatusRef.current({
              buildId: activeBuild.id,
              token: vocabBreakToken
            });
            break;
          }

          case 'vocabulary:collected-words': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const vocabCollectedToken = await ensureBuildApiToken([
              'vocabulary:read'
            ]);
            response = await getBuildCollectedVocabularyWordsRef.current({
              buildId: activeBuild.id,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: vocabCollectedToken
            });
            break;
          }

          case 'shared-db:get-topics': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbTopicsToken = await ensureBuildApiToken([
              'sharedDb:read'
            ]);
            response = await getSharedDbTopicsRef.current({
              buildId: activeBuild.id,
              token: sharedDbTopicsToken
            });
            break;
          }

          case 'shared-db:create-topic': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbCreateTopicToken = await ensureBuildApiToken([
              'sharedDb:write'
            ]);
            response = await createSharedDbTopicRef.current({
              buildId: activeBuild.id,
              name: payload?.name,
              token: sharedDbCreateTopicToken
            });
            break;
          }

          case 'shared-db:get-entries': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbEntriesToken = await ensureBuildApiToken([
              'sharedDb:read'
            ]);
            response = await getSharedDbEntriesRef.current({
              buildId: activeBuild.id,
              topicName: payload?.topicName,
              topicId: payload?.topicId,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: sharedDbEntriesToken
            });
            break;
          }

          case 'shared-db:add-entry': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbAddEntryToken = await ensureBuildApiToken([
              'sharedDb:write'
            ]);
            response = await addSharedDbEntryRef.current({
              buildId: activeBuild.id,
              topicName: payload?.topicName,
              topicId: payload?.topicId,
              data: payload?.data,
              token: sharedDbAddEntryToken
            });
            break;
          }

          case 'shared-db:update-entry': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbUpdateEntryToken = await ensureBuildApiToken([
              'sharedDb:write'
            ]);
            response = await updateSharedDbEntryRef.current({
              buildId: activeBuild.id,
              entryId: payload?.entryId,
              data: payload?.data,
              token: sharedDbUpdateEntryToken
            });
            break;
          }

          case 'shared-db:delete-entry': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const sharedDbDeleteEntryToken = await ensureBuildApiToken([
              'sharedDb:write'
            ]);
            response = await deleteSharedDbEntryRef.current({
              buildId: activeBuild.id,
              entryId: payload?.entryId,
              token: sharedDbDeleteEntryToken
            });
            break;
          }

          case 'private-db:get': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const privateDbReadToken = await ensureBuildApiToken([
              'privateDb:read'
            ]);
            response = await getPrivateDbItemRef.current({
              buildId: activeBuild.id,
              key: payload?.key,
              token: privateDbReadToken
            });
            break;
          }

          case 'private-db:list': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const privateDbListToken = await ensureBuildApiToken([
              'privateDb:read'
            ]);
            response = await listPrivateDbItemsRef.current({
              buildId: activeBuild.id,
              prefix: payload?.prefix,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: privateDbListToken
            });
            break;
          }

          case 'private-db:set': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const privateDbWriteToken = await ensureBuildApiToken([
              'privateDb:write'
            ]);
            response = await setPrivateDbItemRef.current({
              buildId: activeBuild.id,
              key: payload?.key,
              value: payload?.value,
              token: privateDbWriteToken
            });
            break;
          }

          case 'private-db:remove': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const privateDbDeleteToken = await ensureBuildApiToken([
              'privateDb:write'
            ]);
            response = await deletePrivateDbItemRef.current({
              buildId: activeBuild.id,
              key: payload?.key,
              token: privateDbDeleteToken
            });
            break;
          }

          case 'jobs:schedule': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const jobsWriteToken = await ensureBuildApiToken(['jobs:write']);
            response = await scheduleBuildJobRef.current({
              buildId: activeBuild.id,
              name: payload?.name,
              runAt: payload?.runAt,
              intervalSeconds: payload?.intervalSeconds,
              maxRuns: payload?.maxRuns,
              data: payload?.data,
              scope: payload?.scope,
              token: jobsWriteToken
            });
            break;
          }

          case 'jobs:list': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const jobsReadToken = await ensureBuildApiToken(['jobs:read']);
            response = await listBuildJobsRef.current({
              buildId: activeBuild.id,
              scope: payload?.scope,
              status: payload?.status,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: jobsReadToken
            });
            break;
          }

          case 'jobs:cancel': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const jobsCancelToken = await ensureBuildApiToken(['jobs:write']);
            response = await cancelBuildJobRef.current({
              buildId: activeBuild.id,
              jobId: payload?.jobId,
              token: jobsCancelToken
            });
            break;
          }

          case 'jobs:claim-due': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const jobsClaimToken = await ensureBuildApiToken(['jobs:write']);
            response = await claimDueBuildJobsRef.current({
              buildId: activeBuild.id,
              scope: payload?.scope,
              limit: payload?.limit,
              token: jobsClaimToken
            });
            break;
          }

          case 'mail:send': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const mailSendToken = await ensureBuildApiToken(['mail:send']);
            response = await sendBuildMailRef.current({
              buildId: activeBuild.id,
              to: payload?.to,
              subject: payload?.subject,
              text: payload?.text,
              html: payload?.html,
              from: payload?.from,
              replyTo: payload?.replyTo,
              meta: payload?.meta,
              token: mailSendToken
            });
            break;
          }

          case 'mail:list': {
            if (!activeBuild?.id) {
              throw new Error('Build not found');
            }
            const mailReadToken = await ensureBuildApiToken(['mail:read']);
            response = await listBuildMailRef.current({
              buildId: activeBuild.id,
              status: payload?.status,
              limit: payload?.limit,
              cursor: payload?.cursor,
              token: mailReadToken
            });
            break;
          }

          default:
            throw new Error(`Unknown request type: ${type}`);
        }

        // SECURITY: Use '*' because blob URLs have null origins.
        // Security is enforced by validating event.source above.
        sourceWindow.postMessage(
          {
            source: 'twinkle-parent',
            id,
            payload: response
          },
          '*'
        );

        if (owner) {
          if (type === 'ai:chat') {
            void handleMissionProgress({
              promptListUsed: true,
              aiChatUsed: true
            });
          }
          if (type === 'ai:list-prompts') {
            void handleMissionProgress({ promptListUsed: true });
          }
          if (type === 'db:load' || type === 'db:save') {
            void handleMissionProgress({ dbUsed: true });
          }
        }
      } catch (error: any) {
        sourceWindow.postMessage(
          {
            source: 'twinkle-parent',
            id,
            error: error.message || 'Unknown error'
          },
          '*'
        );
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={panelClass}>
      <div className={toolbarClass}>
        <div className={toolbarTitleClass}>
          <Icon icon="laptop-code" />
          Workspace
        </div>
        <div className={toolbarActionsClass}>
          {isOwner && (
            <GameCTAButton
              variant="purple"
              size="md"
              icon="clock"
              onClick={() => setHistoryOpen(true)}
            >
              History
            </GameCTAButton>
          )}
          <SegmentedToggle<'preview' | 'code'>
            value={viewMode}
            onChange={setViewMode}
            options={workspaceViewOptions}
            size="md"
            ariaLabel="Workspace mode"
          />
        </div>
      </div>

      <div
        className={css`
          flex: 1;
          overflow: hidden;
          background: #fff;
          min-height: 0;
        `}
      >
        {viewMode === 'preview' ? (
          (previewFrameSources.primary ||
            previewFrameSources.secondary ||
            previewSrc) ? (
            <div className={previewStageClass}>
              {!previewFrameReady[activePreviewFrame] && (
                <div className={previewPreloadSurfaceClass}>
                  <div className={previewPreloadIconWrapClass}>
                    <Icon icon="spinner" className={previewSpinnerClass} />
                  </div>
                  <div className={previewPreloadLabelClass}>Loading...</div>
                </div>
              )}
              {previewFrameSources.primary && (
                <iframe
                  ref={primaryIframeRef}
                  src={previewFrameSources.primary}
                  title="Preview (primary)"
                  sandbox="allow-scripts"
                  onLoad={() =>
                    handlePreviewFrameLoad(
                      'primary',
                      previewFrameSources.primary
                    )
                  }
                  className={previewIframeClass}
                  style={{
                    opacity:
                      activePreviewFrame === 'primary' &&
                      previewFrameReady.primary
                        ? 1
                        : 0,
                    pointerEvents:
                      activePreviewFrame === 'primary' &&
                      previewFrameReady.primary
                        ? 'auto'
                        : 'none'
                  }}
                />
              )}
              {previewFrameSources.secondary && (
                <iframe
                  ref={secondaryIframeRef}
                  src={previewFrameSources.secondary}
                  title="Preview (secondary)"
                  sandbox="allow-scripts"
                  onLoad={() =>
                    handlePreviewFrameLoad(
                      'secondary',
                      previewFrameSources.secondary
                    )
                  }
                  className={previewIframeClass}
                  style={{
                    opacity:
                      activePreviewFrame === 'secondary' &&
                      previewFrameReady.secondary
                        ? 1
                        : 0,
                    pointerEvents:
                      activePreviewFrame === 'secondary' &&
                      previewFrameReady.secondary
                        ? 'auto'
                        : 'none'
                  }}
                />
              )}
              {previewTransitioning && (
                <div className={previewLoadingOverlayClass}>
                  <Icon icon="spinner" className={previewSpinnerClass} />
                  Updating preview
                </div>
              )}
            </div>
          ) : (
            <div
              className={css`
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--chat-text);
                text-align: center;
                padding: 2rem;
                background: #fff;
              `}
            >
              <Icon
                icon="laptop-code"
                size="3x"
                style={{ marginBottom: '1rem', opacity: 0.6 }}
              />
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                No preview available yet
              </p>
              <p
                style={{
                  margin: '0.5rem 0 0 0',
                  fontSize: '0.9rem',
                  color: 'var(--chat-text)',
                  opacity: 0.6
                }}
              >
                {isOwner
                  ? 'Use the chat to describe what you want to build'
                  : 'This build has no code yet'}
              </p>
            </div>
          )
        ) : (
          <div
            className={css`
              height: 100%;
              min-height: 0;
              display: grid;
              grid-template-columns: 280px 1fr;
              background: #111827;
              @media (max-width: ${mobileMaxWidth}) {
                grid-template-columns: 1fr;
                grid-template-rows: 220px 1fr;
              }
            `}
          >
            <div
              className={css`
                border-right: 1px solid rgba(255, 255, 255, 0.08);
                background: #0b1220;
                min-height: 0;
                display: flex;
                flex-direction: column;
                @media (max-width: ${mobileMaxWidth}) {
                  border-right: none;
                  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }
              `}
            >
              <div
                className={css`
                  padding: 0.7rem 0.8rem;
                  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 0.5rem;
                  color: #e5e7eb;
                  font-size: 0.75rem;
                  letter-spacing: 0.02em;
                  text-transform: uppercase;
                  font-weight: 800;
                `}
              >
                <span>Project files</span>
                <span>{editableProjectFiles.length}</span>
              </div>
              {isOwner && (
                <div
                  className={css`
                    padding: 0.6rem 0.65rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex;
                    gap: 0.4rem;
                  `}
                >
                  <input
                    value={newFilePath}
                    onChange={(e) => setNewFilePath(e.target.value)}
                    placeholder="/src/app.js"
                    className={css`
                      flex: 1;
                      min-width: 0;
                      border: 1px solid rgba(255, 255, 255, 0.16);
                      border-radius: 8px;
                      background: rgba(17, 24, 39, 0.8);
                      color: #e5e7eb;
                      padding: 0.45rem 0.5rem;
                      font-size: 0.75rem;
                      &:focus {
                        outline: none;
                        border-color: rgba(65, 140, 235, 0.8);
                      }
                    `}
                  />
                  <button
                    type="button"
                    onClick={handleAddProjectFile}
                    className={css`
                      border: 1px solid rgba(255, 255, 255, 0.16);
                      border-radius: 8px;
                      background: rgba(65, 140, 235, 0.18);
                      color: #dbeafe;
                      padding: 0.4rem 0.55rem;
                      cursor: pointer;
                      font-size: 0.75rem;
                      font-weight: 700;
                      &:hover {
                        background: rgba(65, 140, 235, 0.3);
                      }
                    `}
                    aria-label="Add file"
                    title="Add file"
                  >
                    <Icon icon="plus" />
                  </button>
                </div>
              )}
              {isOwner && (
                <div
                  className={css`
                    padding: 0.55rem 0.7rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                    display: flex;
                    flex-direction: column;
                    gap: 0.45rem;
                  `}
                >
                  {selectedFolderPath && (
                    <div
                      className={css`
                        display: flex;
                        align-items: center;
                        gap: 0.4rem;
                      `}
                    >
                      <input
                        value={folderMoveTargetPath}
                        onChange={(e) =>
                          setFolderMoveTargetPath(e.target.value)
                        }
                        placeholder="/new/folder/path"
                        className={css`
                          flex: 1;
                          min-width: 0;
                          border: 1px solid rgba(255, 255, 255, 0.16);
                          border-radius: 8px;
                          background: rgba(17, 24, 39, 0.82);
                          color: #e5e7eb;
                          padding: 0.42rem 0.5rem;
                          font-size: 0.72rem;
                        `}
                      />
                      <button
                        type="button"
                        onClick={handleMoveSelectedFolder}
                        className={css`
                          border: 1px solid rgba(255, 255, 255, 0.18);
                          border-radius: 8px;
                          background: rgba(34, 197, 94, 0.2);
                          color: #bbf7d0;
                          padding: 0.36rem 0.52rem;
                          font-size: 0.72rem;
                          font-weight: 700;
                          cursor: pointer;
                        `}
                        title={`Move folder ${selectedFolderPath}`}
                      >
                        Move folder
                      </button>
                    </div>
                  )}
                  <label
                    className={css`
                      display: inline-flex;
                      align-items: center;
                      gap: 0.35rem;
                      color: #cbd5e1;
                      font-size: 0.72rem;
                      cursor: pointer;
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={overwritePathConflicts}
                      onChange={(e) =>
                        setOverwritePathConflicts(e.target.checked)
                      }
                    />
                    Overwrite path conflicts
                  </label>
                </div>
              )}
              <div
                className={css`
                  flex: 1;
                  min-height: 0;
                  overflow: auto;
                  padding: 0.45rem;
                  display: flex;
                  flex-direction: column;
                  gap: 0.35rem;
                `}
              >
                {projectExplorerEntries.map((entry) => {
                  if (entry.kind === 'folder') {
                    const isCollapsed = Boolean(collapsedFolders[entry.path]);
                    const isSelected = selectedFolderPath === entry.path;
                    return (
                      <div
                        key={`folder-${entry.path}`}
                        className={css`
                          display: flex;
                          align-items: center;
                          gap: 0.28rem;
                        `}
                        style={{
                          marginLeft: `${entry.depth * 0.8}rem`
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFolderCollapsed(entry.path)}
                          className={css`
                            border: 1px solid rgba(255, 255, 255, 0.12);
                            border-radius: 8px;
                            background: rgba(148, 163, 184, 0.16);
                            color: #cbd5e1;
                            padding: 0.3rem 0.45rem;
                            font-size: 0.68rem;
                            cursor: pointer;
                          `}
                        >
                          {isCollapsed ? '[+]' : '[-]'} {entry.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectFolder(entry.path)}
                          className={css`
                            flex: 1;
                            min-width: 0;
                            text-align: left;
                            border: 1px solid
                              ${isSelected
                                ? 'rgba(65, 140, 235, 0.7)'
                                : 'rgba(255, 255, 255, 0.08)'};
                            background: ${isSelected
                              ? 'rgba(65, 140, 235, 0.25)'
                              : 'rgba(148, 163, 184, 0.1)'};
                            color: #cbd5e1;
                            border-radius: 8px;
                            padding: 0.34rem 0.48rem;
                            cursor: pointer;
                            font-size: 0.74rem;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 0.5rem;
                          `}
                          title={entry.path}
                        >
                          <span
                            className={css`
                              overflow: hidden;
                              text-overflow: ellipsis;
                              white-space: nowrap;
                            `}
                          >
                            {entry.name}
                          </span>
                          <span>{entry.fileCount}</span>
                        </button>
                      </div>
                    );
                  }

                  const file = entry.file;
                  const isActive = file.path === activeFilePath;
                  const isDirty =
                    persistedFileContentByPath.get(file.path) !== file.content;
                  const displayName = getFileNameFromPath(file.path);
                  return (
                    <div
                      key={`file-${file.path}`}
                      className={css`
                        display: flex;
                        align-items: center;
                        gap: 0.3rem;
                        margin-left: ${(entry.depth + 1) * 0.8}rem;
                      `}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilePath(file.path);
                          setSelectedFolderPath(null);
                          setProjectFileError('');
                          setPathConflictList([]);
                        }}
                        className={css`
                          flex: 1;
                          min-width: 0;
                          text-align: left;
                          border: 1px solid
                            ${isActive
                              ? 'rgba(65, 140, 235, 0.65)'
                              : 'rgba(255, 255, 255, 0.08)'};
                          background: ${isActive
                            ? 'rgba(65, 140, 235, 0.2)'
                            : 'rgba(17, 24, 39, 0.6)'};
                          color: ${isActive ? '#dbeafe' : '#e5e7eb'};
                          border-radius: 8px;
                          padding: 0.42rem 0.5rem;
                          cursor: pointer;
                          font-size: 0.76rem;
                          display: flex;
                          align-items: center;
                          justify-content: space-between;
                          gap: 0.45rem;
                        `}
                        title={file.path}
                      >
                        <span
                          className={css`
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                          `}
                        >
                          {displayName}
                        </span>
                        {isDirty && (
                          <span
                            className={css`
                              color: #fbbf24;
                              font-weight: 900;
                            `}
                            aria-label="Unsaved changes"
                            title="Unsaved changes"
                          >
                            •
                          </span>
                        )}
                      </button>
                      {isOwner && !isIndexHtmlPath(file.path) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteProjectFile(file.path)}
                          className={css`
                            border: 1px solid rgba(255, 255, 255, 0.12);
                            background: rgba(239, 68, 68, 0.14);
                            color: #fecaca;
                            border-radius: 8px;
                            padding: 0.38rem 0.5rem;
                            cursor: pointer;
                            &:hover {
                              background: rgba(239, 68, 68, 0.24);
                            }
                          `}
                          title={`Delete ${file.path}`}
                        >
                          <Icon icon="trash-alt" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div
              className={css`
                position: relative;
                min-height: 0;
                display: grid;
                grid-template-rows: auto 1fr;
              `}
            >
              <div
                className={css`
                  padding: 0.55rem 0.75rem;
                  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 0.75rem;
                  background: #0f172a;
                `}
              >
                <div
                  className={css`
                    min-width: 0;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                  `}
                >
                  <div
                    className={css`
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;
                      color: #e5e7eb;
                      font-size: 0.8rem;
                      font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                    `}
                    title={activeFile?.path || '/index.html'}
                  >
                    {activeFile?.path || '/index.html'}
                  </div>
                  {isOwner && activeFile && (
                    <div
                      className={css`
                        display: flex;
                        align-items: center;
                        gap: 0.4rem;
                      `}
                    >
                      <input
                        value={renamePathInput}
                        onChange={(e) => setRenamePathInput(e.target.value)}
                        placeholder="/src/new-path.js"
                        className={css`
                          flex: 1;
                          min-width: 0;
                          border: 1px solid rgba(255, 255, 255, 0.16);
                          border-radius: 8px;
                          background: rgba(17, 24, 39, 0.85);
                          color: #e5e7eb;
                          padding: 0.3rem 0.45rem;
                          font-size: 0.72rem;
                          font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                          &:focus {
                            outline: none;
                            border-color: rgba(65, 140, 235, 0.8);
                          }
                        `}
                      />
                      <button
                        type="button"
                        onClick={handleRenameOrMoveActiveFile}
                        className={css`
                          border: 1px solid rgba(255, 255, 255, 0.18);
                          border-radius: 8px;
                          background: rgba(65, 140, 235, 0.18);
                          color: #dbeafe;
                          padding: 0.3rem 0.55rem;
                          font-size: 0.72rem;
                          font-weight: 700;
                          cursor: pointer;
                          &:hover {
                            background: rgba(65, 140, 235, 0.3);
                          }
                        `}
                      >
                        Move
                      </button>
                    </div>
                  )}
                </div>
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #e5e7eb;
                    font-size: 0.72rem;
                  `}
                >
                  {hasUnsavedProjectFileChanges ? (
                    <span
                      className={css`
                        color: #fbbf24;
                        font-weight: 700;
                      `}
                    >
                      Unsaved
                    </span>
                  ) : (
                    <span
                      className={css`
                        color: #86efac;
                        font-weight: 700;
                      `}
                    >
                      Saved
                    </span>
                  )}
                  {isOwner && (
                    <GameCTAButton
                      variant="primary"
                      size="sm"
                      disabled={
                        savingProjectFiles || !hasUnsavedProjectFileChanges
                      }
                      loading={savingProjectFiles}
                      onClick={handleSaveEditableProjectFiles}
                    >
                      {savingProjectFiles ? 'Saving...' : 'Save files'}
                    </GameCTAButton>
                  )}
                </div>
              </div>
              {activeFile ? (
                <textarea
                  value={activeFile.content}
                  onChange={(e) =>
                    handleEditableFileContentChange(e.target.value)
                  }
                  readOnly={!isOwner}
                  spellCheck={false}
                  className={css`
                    width: 100%;
                    height: 100%;
                    padding: 1rem;
                    border: none;
                    resize: none;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 0.85rem;
                    line-height: 1.5;
                    background: #111827;
                    color: #d4d4d4;
                    &:focus {
                      outline: none;
                    }
                  `}
                />
              ) : (
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: #cbd5e1;
                    background: #111827;
                  `}
                >
                  No file selected
                </div>
              )}
              {(projectFileError || pathConflictList.length > 0) && (
                <div
                  className={css`
                    position: absolute;
                    right: 0.8rem;
                    bottom: 0.8rem;
                    background: rgba(239, 68, 68, 0.16);
                    border: 1px solid rgba(239, 68, 68, 0.35);
                    color: #fecaca;
                    border-radius: 8px;
                    padding: 0.45rem 0.6rem;
                    font-size: 0.75rem;
                    max-width: 28rem;
                  `}
                >
                  {projectFileError || 'Path conflicts detected.'}
                  {pathConflictList.length > 0 && (
                    <div
                      className={css`
                        margin-top: 0.35rem;
                        border-top: 1px solid rgba(255, 255, 255, 0.22);
                        padding-top: 0.35rem;
                        max-height: 7rem;
                        overflow: auto;
                        font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
                        font-size: 0.68rem;
                        line-height: 1.35;
                      `}
                    >
                      {pathConflictList.map((path) => (
                        <div key={path}>{path}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Modal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        size="md"
        modalKey="BuildVersionHistory"
        hasHeader={false}
        showCloseButton={false}
        bodyPadding={0}
        aria-label="Version history"
        style={{
          backgroundColor: '#fff',
          boxShadow: 'none',
          border: '1px solid var(--ui-border)'
        }}
      >
        <div className={historyModalShellClass}>
          <div className={historyModalHeaderClass}>
            <div className={historyModalTitleClass}>Version History</div>
            <button
              className={historyModalCloseButtonClass}
              onClick={() => setHistoryOpen(false)}
              type="button"
              aria-label="Close version history"
            >
              <Icon icon="times" />
            </button>
          </div>
          <div className={historyModalContentClass}>
            {loadingVersions ? (
              <div
                className={css`
                  padding: 1rem;
                  text-align: center;
                  color: var(--chat-text);
                  opacity: 0.7;
                `}
              >
                Loading versions...
              </div>
            ) : versions.length === 0 ? (
              <div
                className={css`
                  padding: 1rem;
                  text-align: center;
                  color: var(--chat-text);
                  opacity: 0.7;
                `}
              >
                No versions yet. Ask Copilot to generate or review code to
                create version history.
              </div>
            ) : (
              versions.map((version) => (
                <div key={version.id} className={versionRowClass}>
                  <div>
                    <div
                      className={css`
                        font-weight: 700;
                        color: var(--chat-text);
                      `}
                    >
                      v{version.version}
                    </div>
                    {version.summary ? (
                      <div
                        className={css`
                          font-size: 0.9rem;
                          color: var(--chat-text);
                          opacity: 0.75;
                        `}
                      >
                        {version.summary}
                      </div>
                    ) : null}
                    <div className={versionMetaClass}>
                      {timeSince(version.createdAt)} ·{' '}
                      {version.createdByRole === 'assistant' ? 'AI' : 'You'}
                      {version.gitCommitSha
                        ? ` · ${String(version.gitCommitSha).slice(0, 7)}`
                        : ''}
                    </div>
                  </div>
                  <GameCTAButton
                    variant="orange"
                    size="sm"
                    onClick={() => handleRestoreVersion(version.id)}
                    disabled={restoringVersionId === version.id}
                    loading={restoringVersionId === version.id}
                  >
                    {restoringVersionId === version.id
                      ? 'Restoring...'
                      : 'Restore'}
                  </GameCTAButton>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );

  async function handleMissionProgress(newState: {
    promptListUsed?: boolean;
    aiChatUsed?: boolean;
    dbUsed?: boolean;
  }) {
    if (!userIdRef.current || !isOwnerRef.current) return;
    const current = missionProgressRef.current;
    const nextState: {
      promptListUsed?: boolean;
      aiChatUsed?: boolean;
      dbUsed?: boolean;
    } = {};

    if (newState.promptListUsed && !current.promptListUsed) {
      nextState.promptListUsed = true;
    }
    if (newState.aiChatUsed && !current.aiChatUsed) {
      nextState.aiChatUsed = true;
    }
    if (newState.dbUsed && !current.dbUsed) {
      nextState.dbUsed = true;
    }

    if (Object.keys(nextState).length === 0) return;

    missionProgressRef.current = { ...current, ...nextState };
    onUpdateUserMissionStateRef.current({
      missionType: 'build',
      newState: nextState
    });
    try {
      await updateMissionStatusRef.current({
        missionType: 'build',
        newStatus: nextState
      });
    } catch {
      return;
    }
  }
}
