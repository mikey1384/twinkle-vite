import { parse as parseJavaScriptModule } from '@babel/parser';
import { normalizeProjectFilePath } from './projectFiles';

const MODULE_SPECIFIER_REWRITE_CACHE_MAX_ENTRIES = 500;

const moduleSpecifierRewriteCache = new Map<string, string>();

const LEGACY_TWINKLE_SDK_METHOD_REPLACEMENTS = [
  ['Twinkle.api.getUser', 'Twinkle.users.getUser'],
  ['Twinkle.api.getUsers', 'Twinkle.users.getUsers'],
  [
    'Twinkle.api.getDailyReflectionsByUser',
    'Twinkle.reflections.getDailyReflectionsByUser'
  ],
  ['Twinkle.api.getDailyReflections', 'Twinkle.reflections.getDailyReflections'],
  ['Twinkle.content.getMySubjects', 'Twinkle.subjects.getMySubjects'],
  ['Twinkle.content.getSubjectComments', 'Twinkle.subjects.getSubjectComments'],
  ['Twinkle.content.getSubject', 'Twinkle.subjects.getSubject'],
  [
    'Twinkle.content.getProfileCommentCounts',
    'Twinkle.profileComments.getProfileCommentCounts'
  ],
  [
    'Twinkle.content.getProfileCommentIds',
    'Twinkle.profileComments.getProfileCommentIds'
  ],
  [
    'Twinkle.content.getCommentsByIds',
    'Twinkle.profileComments.getCommentsByIds'
  ],
  [
    'Twinkle.content.getProfileComments',
    'Twinkle.profileComments.getProfileComments'
  ]
] as const;

export function hashPreviewCode(code: string) {
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

export function buildPreviewCodeSignature(codeWithSdk: string | null) {
  if (!codeWithSdk) return null;
  return `${codeWithSdk.length}:${hashPreviewCode(codeWithSdk)}`;
}

export function rewriteLegacyTwinkleSdkSource(source: string) {
  if (!source) return source;
  let rewrittenSource = source;
  for (const [legacyMethod, nextMethod] of LEGACY_TWINKLE_SDK_METHOD_REPLACEMENTS) {
    if (!rewrittenSource.includes(legacyMethod)) continue;
    rewrittenSource = rewrittenSource.split(legacyMethod).join(nextMethod);
  }
  return rewrittenSource;
}

export function resolveLocalProjectPathFromBase(rawValue: string, basePath: string) {
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

export function resolveLocalProjectPath(rawValue: string) {
  return resolveLocalProjectPathFromBase(rawValue, '/index.html');
}

export function isPotentialLocalModuleFile(filePath: string) {
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

function buildLocalModuleImportSpecifier(filePath: string) {
  return `twinkle-local${normalizeProjectFilePath(filePath)}`;
}

export function rewriteLocalModuleSpecifiersToAbsolutePaths({
  source,
  modulePath,
  localProjectPaths,
  localProjectPathsKey,
  rewriteResolvedPath
}: {
  source: string;
  modulePath: string;
  localProjectPaths: Set<string>;
  localProjectPathsKey: string;
  rewriteResolvedPath?: ((resolvedPath: string) => string) | null;
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
    if (typeof rewriteResolvedPath === 'function') {
      return rewriteResolvedPath(resolvedPath);
    }
    return buildLocalModuleImportSpecifier(resolvedPath);
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

export function buildLocalProjectPathsKey(localProjectPaths: Set<string>) {
  const sortedLocalProjectPaths = Array.from(localProjectPaths.values()).sort((a, b) =>
    a.localeCompare(b)
  );
  return `${sortedLocalProjectPaths.length}:${hashPreviewCode(
    sortedLocalProjectPaths.join('\n')
  )}`;
}

export function buildLocalModuleImportMap({
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
    const rewrittenSdkSource = isJsonModule
      ? source
      : rewriteLegacyTwinkleSdkSource(source);
    const rewrittenSource = isJsonModule
      ? source
      : rewriteLocalModuleSpecifiersToAbsolutePaths({
          source: rewrittenSdkSource,
          modulePath: normalizedPath,
          localProjectPaths,
          localProjectPathsKey
        });
    const mimeType = isJsonModule ? 'application/json' : 'text/javascript';
    imports[buildLocalModuleImportSpecifier(normalizedPath)] = `data:${mimeType};charset=utf-8,${encodeURIComponent(
      rewrittenSource
    )}`;
  }
  return imports;
}
