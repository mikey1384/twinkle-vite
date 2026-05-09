import type React from 'react';
import { parse as parseJavaScriptModule } from '@babel/parser';
import type { BuildRuntimeObservationIssue } from '../../types/runtimeObservationTypes';
import {
  BUILD_APP_PREVIEW_IFRAME_SANDBOX,
  BUILD_APP_RUNTIME_IFRAME_SANDBOX
} from '~/helpers/buildIframePermissions';
import { canUseSameOriginBuildPreviewSandbox } from '~/helpers/buildPreviewOriginHelpers';
import { resolveLocalProjectPathFromBase } from './moduleRewrite';
import { normalizeProjectFilePath } from './projectFiles';
import type { EditableProjectFile, PreviewRuntimeUploadAsset } from '../types';

export const BUILD_PROJECT_UPLOAD_ACCEPT =
  '.html,.htm,.css,.js,.mjs,.cjs,.json,.txt,.md,.svg,.xml,.csv,.yml,.yaml';

export function normalizeUploadInputFiles(uploadInput: FileList | File[] | null) {
  if (!uploadInput) {
    return [];
  }
  return Array.from(uploadInput);
}
const BUILD_PROJECT_TEXT_UPLOAD_EXTENSIONS = [
  '.html',
  '.htm',
  '.css',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.txt',
  '.md',
  '.svg',
  '.xml',
  '.csv',
  '.yml',
  '.yaml'
] as const;
const BUILD_PROJECT_UNSUPPORTED_UPLOAD_EXTENSIONS = [
  '.jsx',
  '.ts',
  '.tsx'
] as const;
export const EMPTY_PREVIEW_RUNTIME_UPLOAD_ASSETS: PreviewRuntimeUploadAsset[] = [];
export const PREVIEW_HIDDEN_SUSPEND_DELAY_MS = 1200;
export type PreviewLifecycleState = 'active' | 'background' | 'suspended';
const BUILD_PROJECT_TEXT_UPLOAD_MIME_TYPES = new Set([
  'application/json',
  'application/javascript',
  'text/javascript',
  'application/x-javascript',
  'image/svg+xml',
  'application/xml',
  'text/xml',
  'application/yaml',
  'text/yaml',
  'application/x-yaml'
]);

export function buildProjectExportBaseName(title: string, buildId: number) {
  const normalized = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return normalized || `lumine-project-${buildId}`;
}

export function createPreviewRevision(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${value.length.toString(36)}-${(hash >>> 0).toString(36)}`;
}

export function getRuntimePreviewIframeSandbox(frameSrc: string | null | undefined) {
  return canUseSameOriginBuildPreviewSandbox(frameSrc)
    ? BUILD_APP_RUNTIME_IFRAME_SANDBOX
    : BUILD_APP_PREVIEW_IFRAME_SANDBOX;
}

export function getRuntimeIssueLookupTexts(
  issue: BuildRuntimeObservationIssue | null
) {
  if (!issue) return [];
  return [issue.filename || '', issue.stack || '']
    .map((value) => {
      const trimmedValue = String(value || '').trim();
      if (!trimmedValue) return '';
      try {
        return decodeURIComponent(trimmedValue);
      } catch {
        return trimmedValue;
      }
    })
    .filter(Boolean);
}

export function resolveRuntimeIssueProjectFilePath({
  issue,
  files
}: {
  issue: BuildRuntimeObservationIssue | null;
  files: EditableProjectFile[];
}) {
  const lookupTexts = getRuntimeIssueLookupTexts(issue);
  if (lookupTexts.length === 0) return null;

  const sortedFilePaths = files
    .map((file) => normalizeProjectFilePath(file.path))
    .sort((a, b) => b.length - a.length);

  for (const filePath of sortedFilePaths) {
    const filePathWithoutSlash = filePath.replace(/^\//, '');
    for (const lookupText of lookupTexts) {
      if (
        lookupText === filePath ||
        lookupText.includes(`twinkle-local${filePath}`) ||
        lookupText.includes(filePath) ||
        lookupText.includes(`/${filePathWithoutSlash}`)
      ) {
        return filePath;
      }
    }
  }
  return null;
}

export function getRuntimeIssueLocationText({
  issue,
  projectFilePath
}: {
  issue: BuildRuntimeObservationIssue;
  projectFilePath: string | null;
}) {
  const fileLabel =
    projectFilePath ||
    issue.filename ||
    (isPreviewValidatorRuntimeIssue(issue)
      ? 'Preview validator'
      : 'Unknown file');
  const lineLabel =
    issue.lineNumber != null
      ? `:${issue.lineNumber}${issue.columnNumber != null ? `:${issue.columnNumber}` : ''}`
      : '';
  return `${fileLabel}${lineLabel}`;
}

export function getRuntimeIssueStackPreview(issue: BuildRuntimeObservationIssue) {
  return String(issue.stack || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join('\n');
}

export function isPreviewValidatorRuntimeIssue(issue: BuildRuntimeObservationIssue) {
  return (
    issue.kind === 'blankrender' ||
    issue.kind === 'keyboardscroll' ||
    issue.kind === 'playfieldmismatch'
  );
}

export function triggerBrowserDownload({
  bytes,
  fileName,
  mimeType
}: {
  bytes: ArrayBuffer;
  fileName: string;
  mimeType: string;
}) {
  const blob = new Blob([bytes], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 0);
}

export function isSupportedBuildProjectUploadFile(file: File) {
  const lowerName = String(file?.name || '').toLowerCase();
  if (
    BUILD_PROJECT_UNSUPPORTED_UPLOAD_EXTENSIONS.some((extension) =>
      lowerName.endsWith(extension)
    )
  ) {
    return false;
  }
  if (
    BUILD_PROJECT_TEXT_UPLOAD_EXTENSIONS.some((extension) =>
      lowerName.endsWith(extension)
    )
  ) {
    return true;
  }
  const normalizedType = String(file?.type || '').toLowerCase();
  return (
    normalizedType.startsWith('text/') ||
    BUILD_PROJECT_TEXT_UPLOAD_MIME_TYPES.has(normalizedType)
  );
}

export function resolveUploadedProjectFilePath({
  file,
  selectedFolderPath
}: {
  file: File;
  selectedFolderPath: string | null;
}) {
  const rawRelativePath = String(
    file.webkitRelativePath || file.name || ''
  ).replace(/\\/g, '/');
  const relativePathSegments = rawRelativePath.split('/').filter(Boolean);
  if (!selectedFolderPath && String(file.webkitRelativePath || '').trim()) {
    relativePathSegments.shift();
  }
  const relativePath =
    relativePathSegments.join('/') || String(file.name || '').trim();
  if (!relativePath) return '';
  if (!selectedFolderPath) {
    return normalizeProjectFilePath(relativePath);
  }
  return normalizeProjectFilePath(`${selectedFolderPath}/${relativePath}`);
}

export function hasPreservedUploadedProjectRelativePath(file: File) {
  const normalizedRelativePath = String(file.webkitRelativePath || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean);
  return normalizedRelativePath.length > 1;
}

export function getUploadedProjectFolderRelativePath(file: File) {
  const normalizedRelativePath = String(file.webkitRelativePath || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean);
  if (normalizedRelativePath.length <= 1) {
    return null;
  }
  return normalizeProjectFilePath(`/${normalizedRelativePath.slice(1).join('/')}`);
}

export function getImportedRuntimeAttachmentSourcePath(file: File) {
  const folderRelativePath = getUploadedProjectFolderRelativePath(file);
  if (!folderRelativePath) {
    return null;
  }
  if (
    folderRelativePath.startsWith(IMPORTED_RUNTIME_ORIGINAL_ATTACHMENT_PATH_PREFIX) ||
    folderRelativePath.startsWith(IMPORTED_RUNTIME_THUMB_ATTACHMENT_PATH_PREFIX)
  ) {
    return folderRelativePath;
  }
  return null;
}

export function listCaseInsensitiveFileNameCollisions(files: File[]) {
  const originalNameByLowerCaseName = new Map<string, string>();
  const collisionNames = new Set<string>();
  for (const file of files) {
    const fileName = String(file?.name || '').trim();
    if (!fileName) {
      continue;
    }
    const normalizedFileName = fileName.toLowerCase();
    const existingName = originalNameByLowerCaseName.get(normalizedFileName);
    if (existingName && existingName !== fileName) {
      collisionNames.add(existingName);
      collisionNames.add(fileName);
      continue;
    }
    if (existingName) {
      collisionNames.add(fileName);
      continue;
    }
    originalNameByLowerCaseName.set(normalizedFileName, fileName);
  }
  return Array.from(collisionNames).sort((a, b) => a.localeCompare(b));
}

export function summarizeUploadedFileNames(names: string[]) {
  const uniqueNames = Array.from(
    new Set(names.map((name) => String(name || '').trim()).filter(Boolean))
  );
  if (uniqueNames.length <= 3) {
    return uniqueNames.join(', ');
  }
  return `${uniqueNames.slice(0, 3).join(', ')} and ${
    uniqueNames.length - 3
  } more`;
}

const IMPORTED_RUNTIME_ORIGINAL_ATTACHMENT_PATH_PREFIX =
  '/attachments/build-runtime/';
export const IMPORTED_RUNTIME_THUMB_ATTACHMENT_PATH_PREFIX =
  '/attachments/optimized/build-runtime/';

const IMPORTED_RUNTIME_ATTACHMENT_URL_NEIGHBOR_CHAR_REGEX =
  /[A-Za-z0-9._~!$&+,;=:@%/-]/;

export function isNumericPathSegment(value: string | null | undefined) {
  return /^[0-9]+$/.test(String(value || '').trim());
}

export function getImportedRuntimeAttachmentTailSegments({
  filePath,
  prefix
}: {
  filePath: string;
  prefix: string;
}) {
  const normalizedPath = normalizeProjectFilePath(filePath);
  const prefixIndex = normalizedPath.indexOf(prefix);
  if (prefixIndex === -1) {
    return null;
  }
  const suffix = normalizedPath.slice(prefixIndex + prefix.length);
  const segments = suffix.split('/').filter(Boolean);
  return segments.length > 0 ? segments : null;
}

export function getImportedRuntimeOriginalAttachmentAssetId(filePath: string) {
  const segments = getImportedRuntimeAttachmentTailSegments({
    filePath,
    prefix: IMPORTED_RUNTIME_ORIGINAL_ATTACHMENT_PATH_PREFIX
  });
  if (
    !segments ||
    segments.length < 4 ||
    !isNumericPathSegment(segments[0]) ||
    !isNumericPathSegment(segments[1]) ||
    !isNumericPathSegment(segments[2])
  ) {
    return null;
  }
  return segments[2];
}

export function getImportedRuntimeThumbAttachmentAssetId(filePath: string) {
  const segments = getImportedRuntimeAttachmentTailSegments({
    filePath,
    prefix: IMPORTED_RUNTIME_THUMB_ATTACHMENT_PATH_PREFIX
  });
  if (
    !segments ||
    segments.length < 2 ||
    !isNumericPathSegment(segments[0])
  ) {
    return null;
  }
  return segments[0];
}

export function encodeImportedProjectAssetPathForUrl(assetPath: string) {
  const normalizedPath = normalizeProjectFilePath(assetPath);
  const encodedSegments = normalizedPath
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    });
  return encodedSegments.length > 0 ? `/${encodedSegments.join('/')}` : '/';
}

export function buildProjectRootRelativeImportPath(targetPath: string) {
  return normalizeProjectFilePath(targetPath).replace(/^\/+/, '');
}

export function buildRelativeProjectImportPath({
  fromFilePath,
  targetPath
}: {
  fromFilePath: string;
  targetPath: string;
}) {
  const fromSegments = normalizeProjectFilePath(fromFilePath)
    .split('/')
    .filter(Boolean);
  const targetSegments = normalizeProjectFilePath(targetPath)
    .split('/')
    .filter(Boolean);

  if (fromSegments.length > 0) {
    fromSegments.pop();
  }

  let sharedIndex = 0;
  while (
    sharedIndex < fromSegments.length &&
    sharedIndex < targetSegments.length &&
    fromSegments[sharedIndex] === targetSegments[sharedIndex]
  ) {
    sharedIndex += 1;
  }

  const relativeSegments = [
    ...fromSegments.slice(sharedIndex).map(() => '..'),
    ...targetSegments.slice(sharedIndex)
  ];
  return relativeSegments.join('/') || targetSegments[targetSegments.length - 1] || '';
}

export function isHtmlImportedProjectFilePath(filePath: string) {
  const normalizedPath = normalizeProjectFilePath(filePath).toLowerCase();
  return normalizedPath.endsWith('.html') || normalizedPath.endsWith('.htm');
}

export function isPotentialImportedProjectModuleFile(filePath: string) {
  const normalizedPath = normalizeProjectFilePath(filePath).toLowerCase();
  return (
    normalizedPath.endsWith('.js') ||
    normalizedPath.endsWith('.mjs') ||
    normalizedPath.endsWith('.cjs') ||
    normalizedPath.endsWith('.jsx') ||
    normalizedPath.endsWith('.ts') ||
    normalizedPath.endsWith('.tsx') ||
    normalizedPath.endsWith('.json')
  );
}

export function getImportedProjectFileCandidateUrls({
  filePath,
  targetPath
}: {
  filePath: string;
  targetPath: string;
}) {
  const normalizedTargetPath = normalizeProjectFilePath(targetPath);
  const urls = new Set<string>([normalizedTargetPath]);
  const rootRelativePath = buildProjectRootRelativeImportPath(normalizedTargetPath);
  if (rootRelativePath) {
    urls.add(rootRelativePath);
    if (
      !rootRelativePath.startsWith('../') &&
      !rootRelativePath.startsWith('./')
    ) {
      urls.add(`./${rootRelativePath}`);
    }
  }
  const relativePath = buildRelativeProjectImportPath({
    fromFilePath: filePath,
    targetPath: normalizedTargetPath
  });
  if (relativePath) {
    urls.add(relativePath);
    if (!relativePath.startsWith('../') && !relativePath.startsWith('./')) {
      urls.add(`./${relativePath}`);
    }
  }
  return Array.from(urls).filter(Boolean);
}

export function importedProjectFileReferencesProjectFile({
  filePath,
  content,
  targetPath
}: {
  filePath: string;
  content: string;
  targetPath: string;
}) {
  return getImportedProjectFileCandidateUrls({
    filePath,
    targetPath
  }).some((candidateUrl) => candidateUrl && content.includes(candidateUrl));
}

export function collectImportedProjectModuleDependencyPaths({
  filePath,
  content,
  localModulePaths
}: {
  filePath: string;
  content: string;
  localModulePaths: Set<string>;
}) {
  if (!content || localModulePaths.size === 0) {
    return [];
  }

  const dependencyPaths = new Set<string>();

  function maybeAddDependency(node: any) {
    if (!node || typeof node !== 'object') return;
    if (node.type !== 'StringLiteral') return;
    const resolvedPath = resolveLocalProjectPathFromBase(
      String(node.value || ''),
      filePath
    );
    if (resolvedPath && localModulePaths.has(resolvedPath)) {
      dependencyPaths.add(resolvedPath);
    }
  }

  function visitNode(node: any) {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'ImportDeclaration') {
      maybeAddDependency(node.source);
    } else if (
      node.type === 'ExportNamedDeclaration' ||
      node.type === 'ExportAllDeclaration'
    ) {
      maybeAddDependency(node.source);
    } else if (node.type === 'ImportExpression') {
      maybeAddDependency(node.source);
    } else if (
      node.type === 'CallExpression' &&
      node.callee?.type === 'Import' &&
      Array.isArray(node.arguments) &&
      node.arguments.length > 0
    ) {
      maybeAddDependency(node.arguments[0]);
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
    const ast = parseJavaScriptModule(content, {
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
  } catch (error) {
    console.error('Failed to collect imported project module dependency paths', {
      filePath,
      error
    });
  }

  return Array.from(dependencyPaths);
}

export function buildImportedRuntimeAttachmentDocumentBasePathsByScript(
  files: EditableProjectFile[]
) {
  const htmlFiles = files.filter((file) => isHtmlImportedProjectFilePath(file.path));
  const moduleFiles = files.filter((file) =>
    isPotentialImportedProjectModuleFile(file.path)
  );
  const localModulePaths = new Set(
    moduleFiles.map((file) => normalizeProjectFilePath(file.path))
  );
  const documentBasePathsByScriptPath = new Map<string, Map<string, string>>();
  const dependencyPathsByScriptPath = new Map<string, string[]>();

  function seedDocumentBasePath(scriptPath: string, htmlFilePath: string) {
    const htmlDirectory = normalizeProjectFilePath(htmlFilePath)
      .split('/')
      .filter(Boolean)
      .slice(0, -1)
      .join('/');
    const lookupKey = `/${htmlDirectory}`.replace(/\/+$/, '') || '/';
    const nextDocumentBasePaths =
      documentBasePathsByScriptPath.get(scriptPath) || new Map<string, string>();
    if (!nextDocumentBasePaths.has(lookupKey)) {
      nextDocumentBasePaths.set(lookupKey, normalizeProjectFilePath(htmlFilePath));
      documentBasePathsByScriptPath.set(scriptPath, nextDocumentBasePaths);
      return true;
    }
    return false;
  }

  for (const file of moduleFiles) {
    const normalizedPath = normalizeProjectFilePath(file.path);
    for (const htmlFile of htmlFiles) {
      if (
        importedProjectFileReferencesProjectFile({
          filePath: htmlFile.path,
          content: String(htmlFile.content || ''),
          targetPath: normalizedPath
        })
      ) {
        seedDocumentBasePath(normalizedPath, htmlFile.path);
      }
    }
    dependencyPathsByScriptPath.set(
      normalizedPath,
      collectImportedProjectModuleDependencyPaths({
        filePath: normalizedPath,
        content: String(file.content || ''),
        localModulePaths
      })
    );
  }

  const pendingPaths = Array.from(documentBasePathsByScriptPath.keys());
  while (pendingPaths.length > 0) {
    const currentPath = String(pendingPaths.shift() || '');
    const documentBasePaths =
      documentBasePathsByScriptPath.get(currentPath) || null;
    if (!documentBasePaths || documentBasePaths.size === 0) {
      continue;
    }

    for (const dependencyPath of dependencyPathsByScriptPath.get(currentPath) || []) {
      let didChange = false;
      for (const htmlFilePath of documentBasePaths.values()) {
        if (seedDocumentBasePath(dependencyPath, htmlFilePath)) {
          didChange = true;
        }
      }
      if (didChange) {
        pendingPaths.push(dependencyPath);
      }
    }
  }

  const documentBaseFilePathByScriptPath = new Map<string, string>();
  const documentBaseFilePathsByScriptPath = new Map<string, string[]>();
  for (const [scriptPath, documentBasePaths] of documentBasePathsByScriptPath) {
    const baseFilePaths = Array.from(documentBasePaths.values());
    if (baseFilePaths.length > 0) {
      documentBaseFilePathsByScriptPath.set(scriptPath, baseFilePaths);
    }
    if (baseFilePaths.length === 1) {
      documentBaseFilePathByScriptPath.set(
        scriptPath,
        baseFilePaths[0]
      );
    }
  }

  return {
    documentBaseFilePathByScriptPath,
    documentBaseFilePathsByScriptPath
  };
}

export function getImportedProjectAssetCandidateUrls({
  filePath,
  assetPath,
  documentBaseFilePath,
  documentBaseFilePaths
}: {
  filePath: string;
  assetPath: string;
  documentBaseFilePath?: string | null;
  documentBaseFilePaths?: string[] | null;
}) {
  const normalizedAssetPath = normalizeProjectFilePath(assetPath);
  const encodedAssetPath =
    encodeImportedProjectAssetPathForUrl(normalizedAssetPath);
  const urls = new Set<string>([normalizedAssetPath, encodedAssetPath]);
  const projectRootRelativePaths = [
    buildProjectRootRelativeImportPath(normalizedAssetPath),
    buildProjectRootRelativeImportPath(encodedAssetPath)
  ];
  for (const rootRelativePath of projectRootRelativePaths) {
    if (!rootRelativePath) continue;
    urls.add(rootRelativePath);
    if (
      !rootRelativePath.startsWith('../') &&
      !rootRelativePath.startsWith('./')
    ) {
      urls.add(`./${rootRelativePath}`);
    }
  }
  const relativePaths = [
    buildRelativeProjectImportPath({
      fromFilePath: filePath,
      targetPath: normalizedAssetPath
    }),
    buildRelativeProjectImportPath({
      fromFilePath: filePath,
      targetPath: encodedAssetPath
    })
  ];
  for (const relativePath of relativePaths) {
    if (!relativePath) continue;
    urls.add(relativePath);
    if (
      !relativePath.startsWith('../') &&
      !relativePath.startsWith('./')
    ) {
      urls.add(`./${relativePath}`);
    }
  }
  const candidateDocumentBasePaths = Array.from(
    new Set(
      [
        documentBaseFilePath,
        ...(Array.isArray(documentBaseFilePaths) ? documentBaseFilePaths : [])
      ]
        .map((value) => String(value || '').trim())
        .filter(Boolean)
        .map((value) => normalizeProjectFilePath(value))
    )
  );
  for (const normalizedDocumentBaseFilePath of candidateDocumentBasePaths) {
    const documentRelativePaths = [
      buildRelativeProjectImportPath({
        fromFilePath: normalizedDocumentBaseFilePath,
        targetPath: normalizedAssetPath
      }),
      buildRelativeProjectImportPath({
        fromFilePath: normalizedDocumentBaseFilePath,
        targetPath: encodedAssetPath
      })
    ];
    for (const documentRelativePath of documentRelativePaths) {
      if (!documentRelativePath) continue;
      urls.add(documentRelativePath);
      if (
        !documentRelativePath.startsWith('../') &&
        !documentRelativePath.startsWith('./')
      ) {
        urls.add(`./${documentRelativePath}`);
      }
    }
  }
  return Array.from(urls).filter(Boolean);
}

export function isStandaloneImportedRuntimeAttachmentBoundary(
  char: string | undefined
) {
  return !char || !IMPORTED_RUNTIME_ATTACHMENT_URL_NEIGHBOR_CHAR_REGEX.test(char);
}

export function replaceStandaloneImportedRuntimeAttachmentUrl({
  content,
  candidateUrl,
  replacementUrl
}: {
  content: string;
  candidateUrl: string;
  replacementUrl: string;
}) {
  if (!candidateUrl || !replacementUrl || !content.includes(candidateUrl)) {
    return content;
  }

  let nextContent = '';
  let searchIndex = 0;

  while (searchIndex < content.length) {
    const matchIndex = content.indexOf(candidateUrl, searchIndex);
    if (matchIndex === -1) {
      nextContent += content.slice(searchIndex);
      break;
    }

    const afterIndex = matchIndex + candidateUrl.length;
    const beforeChar = matchIndex > 0 ? content[matchIndex - 1] : '';
    const afterChar = afterIndex < content.length ? content[afterIndex] : '';

    nextContent += content.slice(searchIndex, matchIndex);
    if (
      isStandaloneImportedRuntimeAttachmentBoundary(beforeChar) &&
      isStandaloneImportedRuntimeAttachmentBoundary(afterChar)
    ) {
      nextContent += replacementUrl;
    } else {
      nextContent += content.slice(matchIndex, afterIndex);
    }

    searchIndex = afterIndex;
  }

  return nextContent;
}

export function importedProjectFileReferencesRuntimeAttachment({
  filePath,
  content,
  attachmentPath,
  documentBaseFilePath,
  documentBaseFilePaths
}: {
  filePath: string;
  content: string;
  attachmentPath: string;
  documentBaseFilePath?: string | null;
  documentBaseFilePaths?: string[] | null;
}) {
  return getImportedProjectAssetCandidateUrls({
    filePath,
    assetPath: attachmentPath,
    documentBaseFilePath,
    documentBaseFilePaths
  }).some((candidateUrl) => candidateUrl && content.includes(candidateUrl));
}

export function importedProjectFileReferencesLocalAsset({
  filePath,
  content,
  assetPath,
  documentBaseFilePath,
  documentBaseFilePaths
}: {
  filePath: string;
  content: string;
  assetPath: string;
  documentBaseFilePath?: string | null;
  documentBaseFilePaths?: string[] | null;
}) {
  return getImportedProjectAssetCandidateUrls({
    filePath,
    assetPath,
    documentBaseFilePath,
    documentBaseFilePaths
  }).some((candidateUrl) => candidateUrl && content.includes(candidateUrl));
}

export function rewriteImportedProjectFilesWithRuntimeAssetUrls({
  files,
  replacementUrlByAttachmentPath,
  documentBaseFilePathByScriptPath,
  documentBaseFilePathsByScriptPath
}: {
  files: EditableProjectFile[];
  replacementUrlByAttachmentPath: Map<string, string>;
  documentBaseFilePathByScriptPath?: Map<string, string>;
  documentBaseFilePathsByScriptPath?: Map<string, string[]>;
}) {
  if (replacementUrlByAttachmentPath.size === 0) {
    return files;
  }

  return files.map((file) => {
    let nextContent = String(file.content || '');

    for (const [
      attachmentPath,
      replacementUrl
    ] of replacementUrlByAttachmentPath.entries()) {
      const candidateUrls = getImportedProjectAssetCandidateUrls({
        filePath: file.path,
        assetPath: attachmentPath,
        documentBaseFilePath:
          documentBaseFilePathByScriptPath?.get(
            normalizeProjectFilePath(file.path)
          ) || null,
        documentBaseFilePaths:
          documentBaseFilePathsByScriptPath?.get(
            normalizeProjectFilePath(file.path)
          ) || null
      });
      for (const candidateUrl of candidateUrls) {
        nextContent = replaceStandaloneImportedRuntimeAttachmentUrl({
          content: nextContent,
          candidateUrl,
          replacementUrl
        });
      }
    }

    if (nextContent === file.content) {
      return file;
    }
    return {
      ...file,
      content: nextContent
    };
  });
}

export function readLatestEditableProjectFiles(
  editableProjectFilesRef: React.MutableRefObject<EditableProjectFile[]>
) {
  return Array.isArray(editableProjectFilesRef.current)
    ? editableProjectFilesRef.current
    : [];
}

export function mergeEditableProjectFiles(
  baseFiles: EditableProjectFile[],
  overrideFiles: EditableProjectFile[]
) {
  const nextFileContentByPath = new Map<string, string>();
  for (const file of baseFiles) {
    nextFileContentByPath.set(file.path, file.content);
  }
  for (const file of overrideFiles) {
    nextFileContentByPath.set(file.path, file.content);
  }
  return Array.from(nextFileContentByPath.entries()).map(([path, content]) => ({
    path,
    content
  }));
}
