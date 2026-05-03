import React, {
  useDeferredValue,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { parse as parseJavaScriptModule } from '@babel/parser';
import Icon from '~/components/Icon';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import SegmentedToggle from '~/components/Buttons/SegmentedToggle';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import type { BuildCapabilitySnapshot } from '../capabilityTypes';
import type {
  BuildRuntimeExplorationPlan,
  BuildRuntimeObservationState
} from '../runtimeObservationTypes';
import GuestRestrictionBanner from './GuestRestrictionBanner';
import {
  buildEditableProjectFiles,
  buildProjectExplorerEntries,
  getPreferredIndexPath,
  isIndexHtmlPath,
  isPathWithinFolder,
  listCaseInsensitiveProjectFileCollisionPaths,
  normalizeProjectFilePath,
  remapPathPrefix,
  serializeEditableProjectFiles
} from './projectFiles';
import CodeWorkspacePane from './CodeWorkspacePane';
import { usePreviewFrameManager } from './usePreviewFrameManager';
import {
  buildEmptyRuntimeObservationState,
  ensureBuildApiToken,
  normalizeRuntimeExplorationPlan,
  usePreviewHostBridge
} from './usePreviewHostBridge';
import {
  buildPreviewBaseSrc,
  useWorkspacePreviewSrc
} from './usePreviewSource';
import {
  buildPreviewFrameWindowName,
  canUseSameOriginBuildPreviewSandbox,
  getBuildPreviewMessageTargetOrigin
} from '../previewOrigin';
import { BUILD_APP_IFRAME_ALLOW } from '../iframePermissions';
import { resolveLocalProjectPathFromBase } from './moduleRewrite';
import type {
  ArtifactVersion,
  EditableProjectFile,
  PreviewPanelHandle,
  PreviewPanelProps,
  PreviewRuntimeUploadAsset
} from './types';
import VersionHistoryModal from './VersionHistoryModal';
import AgentManualPane from './AgentManualPane';
const GUEST_RESTRICTION_BANNER_TEXT =
  'Some features were restricted because this app uses user-only data. Sign in to access those parts.';

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

const runtimePanelClass = css`
  min-height: 0;
  min-width: 0;
  display: grid;
  grid-template-rows: 1fr;
  background: #fff;
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

type WorkspaceViewMode = 'preview' | 'code' | 'manual';

const workspaceViewOptions = [
  { value: 'preview', label: 'Preview', icon: 'eye' },
  { value: 'code', label: 'Code', icon: 'code' },
  { value: 'manual', label: 'Manual', icon: 'book-open' }
] as const;
const BUILD_PROJECT_UPLOAD_ACCEPT =
  '.html,.htm,.css,.js,.mjs,.cjs,.json,.txt,.md,.svg,.xml,.csv,.yml,.yaml';
const BUILD_PROJECT_ASSET_UPLOAD_ACCEPT =
  'image/*,audio/*,.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.tiff,.tif,.heic,.heif,.avif,.mp3,.wav,.ogg,.m4a,.aac,.flac,.aif,.aiff';

function normalizeUploadInputFiles(uploadInput: FileList | File[] | null) {
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
const BUILD_PROJECT_ASSET_UPLOAD_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
  '.tiff',
  '.tif',
  '.heic',
  '.heif',
  '.avif',
  '.mp3',
  '.wav',
  '.ogg',
  '.m4a',
  '.aac',
  '.flac',
  '.aif',
  '.aiff'
] as const;
const BUILD_PROJECT_UNSUPPORTED_UPLOAD_EXTENSIONS = [
  '.jsx',
  '.ts',
  '.tsx'
] as const;
const EMPTY_PREVIEW_RUNTIME_UPLOAD_ASSETS: PreviewRuntimeUploadAsset[] = [];
const PREVIEW_HIDDEN_SUSPEND_DELAY_MS = 1200;
const PREVIEW_IFRAME_SANDBOX =
  'allow-scripts allow-downloads allow-pointer-lock';
const RUNTIME_CAPABILITY_IFRAME_SANDBOX =
  `${PREVIEW_IFRAME_SANDBOX} allow-same-origin`;

type PreviewLifecycleState = 'active' | 'background' | 'suspended';
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

function buildProjectExportBaseName(title: string, buildId: number) {
  const normalized = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return normalized || `lumine-project-${buildId}`;
}

function getRuntimePreviewIframeSandbox(frameSrc: string | null | undefined) {
  return canUseSameOriginBuildPreviewSandbox(frameSrc)
    ? RUNTIME_CAPABILITY_IFRAME_SANDBOX
    : PREVIEW_IFRAME_SANDBOX;
}

function triggerBrowserDownload({
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

function isSupportedBuildProjectUploadFile(file: File) {
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

function isSupportedBuildAssetUploadFile(file: File) {
  const lowerName = String(file?.name || '').toLowerCase();
  if (
    BUILD_PROJECT_ASSET_UPLOAD_EXTENSIONS.some((extension) =>
      lowerName.endsWith(extension)
    )
  ) {
    return true;
  }
  const normalizedType = String(file?.type || '').toLowerCase();
  return (
    normalizedType.startsWith('image/') || normalizedType.startsWith('audio/')
  );
}

function resolveUploadedProjectFilePath({
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

function hasPreservedUploadedProjectRelativePath(file: File) {
  const normalizedRelativePath = String(file.webkitRelativePath || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean);
  return normalizedRelativePath.length > 1;
}

function getUploadedProjectFolderRelativePath(file: File) {
  const normalizedRelativePath = String(file.webkitRelativePath || '')
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean);
  if (normalizedRelativePath.length <= 1) {
    return null;
  }
  return normalizeProjectFilePath(`/${normalizedRelativePath.slice(1).join('/')}`);
}

function getImportedRuntimeAttachmentSourcePath(file: File) {
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

function listCaseInsensitiveFileNameCollisions(files: File[]) {
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

function summarizeUploadedFileNames(names: string[]) {
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
const IMPORTED_RUNTIME_THUMB_ATTACHMENT_PATH_PREFIX =
  '/attachments/optimized/build-runtime/';

const IMPORTED_RUNTIME_ATTACHMENT_URL_NEIGHBOR_CHAR_REGEX =
  /[A-Za-z0-9._~!$&+,;=:@%/-]/;

function isNumericPathSegment(value: string | null | undefined) {
  return /^[0-9]+$/.test(String(value || '').trim());
}

function getImportedRuntimeAttachmentTailSegments({
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

function getImportedRuntimeOriginalAttachmentAssetId(filePath: string) {
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

function getImportedRuntimeThumbAttachmentAssetId(filePath: string) {
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

function encodeImportedProjectAssetPathForUrl(assetPath: string) {
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

function buildProjectRootRelativeImportPath(targetPath: string) {
  return normalizeProjectFilePath(targetPath).replace(/^\/+/, '');
}

function buildRelativeProjectImportPath({
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

function isHtmlImportedProjectFilePath(filePath: string) {
  const normalizedPath = normalizeProjectFilePath(filePath).toLowerCase();
  return normalizedPath.endsWith('.html') || normalizedPath.endsWith('.htm');
}

function isPotentialImportedProjectModuleFile(filePath: string) {
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

function getImportedProjectFileCandidateUrls({
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

function importedProjectFileReferencesProjectFile({
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

function collectImportedProjectModuleDependencyPaths({
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

function buildImportedRuntimeAttachmentDocumentBasePathsByScript(
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

function getImportedProjectAssetCandidateUrls({
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

function isStandaloneImportedRuntimeAttachmentBoundary(
  char: string | undefined
) {
  return !char || !IMPORTED_RUNTIME_ATTACHMENT_URL_NEIGHBOR_CHAR_REGEX.test(char);
}

function replaceStandaloneImportedRuntimeAttachmentUrl({
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

function importedProjectFileReferencesRuntimeAttachment({
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

function importedProjectFileReferencesLocalAsset({
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

function rewriteImportedProjectFilesWithRuntimeAssetUrls({
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

function readLatestEditableProjectFiles(
  editableProjectFilesRef: React.MutableRefObject<EditableProjectFile[]>
) {
  return Array.isArray(editableProjectFilesRef.current)
    ? editableProjectFilesRef.current
    : [];
}

function mergeEditableProjectFiles(
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

const PreviewPanel = React.forwardRef<PreviewPanelHandle, PreviewPanelProps>(
  function PreviewPanel(
    {
      className,
      build,
      code,
      projectFiles,
      streamingProjectFiles = null,
      streamingFocusFilePath = null,
      isOwner,
      codeWorkspaceAvailable = isOwner,
      onReplaceCode,
      onApplyRestoredProjectFiles,
      onSaveProjectFiles,
      runtimeOnly = false,
      runtimeHostVisible = true,
      capabilitySnapshot = null,
      onEditableProjectFilesStateChange,
      runtimeExplorationPlan = null,
      onRuntimeObservationChange,
      onRuntimeUploadsSync,
      onAiUsagePolicyUpdate,
      onOpenRuntimeUploadsManager,
      currentBuildRuntimeAssets = EMPTY_PREVIEW_RUNTIME_UPLOAD_ASSETS,
      previewSrcOverride = null,
      viewerOverride = null,
      onCaptureReadyChange
    }: PreviewPanelProps,
    ref
  ) {
    const [viewMode, setViewMode] = useState<WorkspaceViewMode>('preview');
    const [historyOpen, setHistoryOpen] = useState(false);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [versions, setVersions] = useState<ArtifactVersion[]>([]);
    const [restoringVersionId, setRestoringVersionId] = useState<number | null>(
      null
    );
    const [artifactId, setArtifactId] = useState<number | null>(
      build.primaryArtifactId ?? null
    );
    const onRuntimeObservationChangeRef = useRef(
      onRuntimeObservationChange || null
    );
    const onRuntimeUploadsSyncRef = useRef(onRuntimeUploadsSync || null);
    const onAiUsagePolicyUpdateRef = useRef(onAiUsagePolicyUpdate || null);
    const onEditableProjectFilesStateChangeRef = useRef(
      onEditableProjectFilesStateChange || null
    );
    const availableWorkspaceViewOptions = useMemo(
      () =>
        codeWorkspaceAvailable
          ? workspaceViewOptions
          : workspaceViewOptions.filter((option) => option.value !== 'code'),
      [codeWorkspaceAvailable]
    );
    const [editableProjectFiles, setEditableProjectFiles] = useState<
      EditableProjectFile[]
    >(() => buildEditableProjectFiles({ code, projectFiles }));
    const [
      hasLocalEditableProjectFileChanges,
      setHasLocalEditableProjectFileChanges
    ] = useState(false);
    const [activeFilePath, setActiveFilePath] = useState('/index.html');
    const [newFilePath, setNewFilePath] = useState('');
    const [renamePathInput, setRenamePathInput] = useState('/index.html');
    const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(
      null
    );
    const [folderMoveTargetPath, setFolderMoveTargetPath] = useState('');
    const [collapsedFolders, setCollapsedFolders] = useState<
      Record<string, boolean>
    >({});
    const [savingProjectFiles, setSavingProjectFiles] = useState(false);
    const [downloadingProjectArchive, setDownloadingProjectArchive] =
      useState(false);
    const [projectFileError, setProjectFileError] = useState('');
    const [workspaceRuntimeAssets, setWorkspaceRuntimeAssets] = useState<
      PreviewRuntimeUploadAsset[]
    >(currentBuildRuntimeAssets);
    const [guestRestrictionBannerVisible, setGuestRestrictionBannerVisible] =
      useState(false);

    useEffect(() => {
      if (!codeWorkspaceAvailable && viewMode === 'code') {
        setViewMode('preview');
      }
    }, [codeWorkspaceAvailable, viewMode]);
    const [runtimeObservationState, setRuntimeObservationState] =
      useState<BuildRuntimeObservationState>(() =>
        buildEmptyRuntimeObservationState({
          buildId: build.id,
          codeSignature: null
        })
      );
    const [previewLifecycleState, setPreviewLifecycleState] =
      useState<PreviewLifecycleState>(() =>
        runtimeHostVisible === false ? 'suspended' : 'active'
      );
    const buildRef = useRef(build);
    const projectFileInputRef = useRef<HTMLInputElement | null>(null);
    const projectFolderInputRef = useRef<HTMLInputElement | null>(null);
    const projectAssetInputRef = useRef<HTMLInputElement | null>(null);
    const editableProjectFilesRef = useRef<EditableProjectFile[]>(
      buildEditableProjectFiles({ code, projectFiles })
    );
    const savingProjectFilesRef = useRef(false);
    const downloadingProjectArchiveRef = useRef(false);
    const wasShowingStreamingCodeRef = useRef(false);
    const streamingAutoFollowEnabledRef = useRef(false);
    const autoReturnToPreviewPendingRef = useRef(false);
    const lastStreamingFocusFilePathRef = useRef<string | null>(null);
    const runtimeObservationStateRef = useRef<BuildRuntimeObservationState>(
      buildEmptyRuntimeObservationState({
        buildId: build.id,
        codeSignature: null
      })
    );
    const isOwnerRef = useRef(isOwner);
    const userIdRef = useRef<number | null>(null);
    const usernameRef = useRef<string | null>(null);
    const profilePicUrlRef = useRef<string | null>(null);
    const guestSessionIdRef = useRef<string | null>(null);

    const persistedProjectFiles = useMemo(
      () => buildEditableProjectFiles({ code, projectFiles }),
      [code, projectFiles]
    );
    const streamedProjectFiles = useMemo(
      () =>
        Array.isArray(streamingProjectFiles) && streamingProjectFiles.length > 0
          ? buildEditableProjectFiles({
              code,
              projectFiles: streamingProjectFiles
            })
          : null,
      [code, streamingProjectFiles]
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
      hasLocalEditableProjectFileChanges &&
      editableProjectFilesSignature !== persistedProjectFilesSignature;
    const deferredEditableProjectFiles = useDeferredValue(editableProjectFiles);
    const previewProjectFiles = hasUnsavedProjectFileChanges
      ? deferredEditableProjectFiles
      : persistedProjectFiles;
    const isShowingStreamingCode =
      Boolean(streamedProjectFiles && streamedProjectFiles.length > 0) &&
      !hasUnsavedProjectFileChanges;
    const displayedProjectFiles = isShowingStreamingCode
      ? streamedProjectFiles || persistedProjectFiles
      : hasUnsavedProjectFileChanges
        ? editableProjectFiles
        : persistedProjectFiles;
    const projectFilesForParent = useMemo(
      () =>
        (hasUnsavedProjectFileChanges
          ? editableProjectFiles
          : persistedProjectFiles
        ).map((file) => ({
          path: file.path,
          content: file.content
        })),
      [
        editableProjectFiles,
        hasUnsavedProjectFileChanges,
        persistedProjectFiles
      ]
    );
    const activeFile = useMemo(
      () =>
        displayedProjectFiles.find((file) => file.path === activeFilePath) ||
        displayedProjectFiles[0] ||
        null,
      [displayedProjectFiles, activeFilePath]
    );

    function openProjectFileUploadPicker() {
      if (
        !isOwner ||
        !codeWorkspaceAvailable ||
        areProjectFileMutationsLocked()
      ) {
        return;
      }
      if (viewMode !== 'code') {
        setViewMode('code');
      }
      projectFileInputRef.current?.click();
    }

    function openProjectFolderImportPicker() {
      if (
        !isOwner ||
        !codeWorkspaceAvailable ||
        areProjectFileMutationsLocked()
      ) {
        return;
      }
      if (viewMode !== 'code') {
        setViewMode('code');
      }
      projectFolderInputRef.current?.click();
    }

    function openProjectAssetUploadPicker() {
      if (
        !isOwner ||
        !codeWorkspaceAvailable ||
        areProjectFileMutationsLocked()
      ) {
        return;
      }
      if (viewMode !== 'code') {
        setViewMode('code');
      }
      projectAssetInputRef.current?.click();
    }

    async function captureThumbnail() {
      const previewPath = await resolveFreshCapturePreviewPath();
      if (!previewPath) {
        throw new Error('Preview is unavailable right now');
      }
      const result = await captureBuildThumbnailPreview({
        buildId: build.id,
        previewPath
      });
      const imageUrl = String(result?.imageUrl || '').trim();
      if (imageUrl) {
        return imageUrl;
      }
      throw new Error(
        String(result?.error || 'Failed to capture preview thumbnail')
      );
    }

    async function resolveFreshCapturePreviewPath() {
      const preferredOverride = String(normalizedPreviewSrcOverride || '').trim();
      if (preferredOverride) {
        return await withFreshPreviewAccessToken(preferredOverride);
      }

      const basePreviewSrc = buildPreviewBaseSrc(build);
      if (!previewAuth.userIdRef.current) {
        return basePreviewSrc;
      }

      const token = await ensureBuildApiToken(['preview:read'], previewAuth);
      const separator = basePreviewSrc.includes('?') ? '&' : '?';
      return `${basePreviewSrc}${separator}buildApiToken=${encodeURIComponent(token)}`;
    }

    async function withFreshPreviewAccessToken(rawPreviewPath: string) {
      try {
        const parsedUrl = new URL(rawPreviewPath, window.location.href);
        if (
          !parsedUrl.pathname.startsWith('/build/preview/') ||
          !previewAuth.userIdRef.current
        ) {
          return parsedUrl.toString();
        }
        const token = await ensureBuildApiToken(['preview:read'], previewAuth);
        parsedUrl.searchParams.set('buildApiToken', token);
        return parsedUrl.toString();
      } catch {
        return rawPreviewPath;
      }
    }

    useImperativeHandle(
      ref,
      () => ({
        openProjectFileUploadPicker,
        openProjectFolderImportPicker,
        openProjectAssetUploadPicker,
        captureThumbnail,
        async importProjectFilesFromChatUpload(files: File[]) {
          const normalizedFiles = normalizeUploadInputFiles(files);
          const filesWithPreservedPaths = normalizedFiles.filter(
            hasPreservedUploadedProjectRelativePath
          );
          const requiresPreservedPaths = filesWithPreservedPaths.length > 0;
          if (
            requiresPreservedPaths &&
            filesWithPreservedPaths.length !== normalizedFiles.length
          ) {
            const message =
              'This upload mixes files with and without folder paths. Use the manual workspace import controls for project files instead.';
            setProjectFileError(message);
            return {
              success: false,
              importedCount: 0,
              error: message
            };
          }
          if (!requiresPreservedPaths && normalizedFiles.length > 1) {
            const nameCollisions =
              listCaseInsensitiveFileNameCollisions(normalizedFiles);
            if (nameCollisions.length > 0) {
              const message = `These files would collide at the project root: ${summarizeUploadedFileNames(
                nameCollisions
              )}. Use the manual workspace import controls instead.`;
              setProjectFileError(message);
              return {
                success: false,
                importedCount: 0,
                error: message
              };
            }
          }
          const result = await handleUploadProjectFiles(normalizedFiles, {
            requireRelativePaths: requiresPreservedPaths,
            targetFolderPath: null
          });
          if (
            result?.success &&
            !requiresPreservedPaths &&
            normalizedFiles.length > 1
          ) {
            const rootImportWarning =
              'Imported these files at the project root because folder paths were not included.';
            const nextWarningText = String(result.warningText || '').trim();
            const combinedWarningText = nextWarningText
              ? `${nextWarningText} ${rootImportWarning}`
              : rootImportWarning;
            setProjectFileError(combinedWarningText);
            return {
              ...result,
              warningText: combinedWarningText
            };
          }
          return result;
        },
        async uploadProjectAssetsFromChatUpload(files: File[]) {
          return await handleUploadProjectAssets(files);
        }
      })
    );

    useEffect(() => {
      const folderInput = projectFolderInputRef.current;
      if (!folderInput) return;
      folderInput.setAttribute('webkitdirectory', '');
      folderInput.setAttribute('directory', '');
    }, []);
    useEffect(() => {
      setWorkspaceRuntimeAssets(currentBuildRuntimeAssets);
    }, [currentBuildRuntimeAssets]);
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
          files: displayedProjectFiles,
          collapsedFolders
        }),
      [displayedProjectFiles, collapsedFolders]
    );

    const keyUserId = useKeyContext((v) => v.myState.userId);
    const keyUsername = useKeyContext((v) => v.myState.username);
    const keyProfilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
    const resolvedUserId =
      typeof viewerOverride?.id === 'number' ? viewerOverride.id : keyUserId;
    const resolvedUsername =
      typeof viewerOverride?.username === 'string'
        ? viewerOverride.username
        : keyUsername;
    const resolvedProfilePicUrl =
      typeof viewerOverride?.profilePicUrl === 'string'
        ? viewerOverride.profilePicUrl
        : keyProfilePicUrl;
    const normalizedPreviewSrcOverride = useMemo(() => {
      const normalized = String(previewSrcOverride || '').trim();
      return normalized || null;
    }, [previewSrcOverride]);
    const captureBuildThumbnailPreview = useAppContext(
      (v) => v.requestHelpers.captureBuildThumbnailPreview
    );
    const downloadBuildProjectArchive = useAppContext(
      (v) => v.requestHelpers.downloadBuildProjectArchive
    );
    const loadBuildAiPrompts = useAppContext(
      (v) => v.requestHelpers.loadBuildAiPrompts
    );
    const callBuildAiChat = useAppContext(
      (v) => v.requestHelpers.callBuildAiChat
    );
    const callBuildRuntimeAiChat = useAppContext(
      (v) => v.requestHelpers.callBuildRuntimeAiChat
    );
    const callBuildRuntimeAiChatStream = useAppContext(
      (v) => v.requestHelpers.callBuildRuntimeAiChatStream
    );
    const generateAIImage = useAppContext(
      (v) => v.requestHelpers.generateAIImage
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
    const listBuildRuntimeFiles = useAppContext(
      (v) => v.requestHelpers.listBuildRuntimeFiles
    );
    const deleteBuildRuntimeFile = useAppContext(
      (v) => v.requestHelpers.deleteBuildRuntimeFile
    );
    const uploadBuildRuntimeFiles = useAppContext(
      (v) => v.requestHelpers.uploadBuildRuntimeFiles
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
    const listBuildChatRooms = useAppContext(
      (v) => v.requestHelpers.listBuildChatRooms
    );
    const createBuildChatRoom = useAppContext(
      (v) => v.requestHelpers.createBuildChatRoom
    );
    const listBuildChatMessages = useAppContext(
      (v) => v.requestHelpers.listBuildChatMessages
    );
    const sendBuildChatMessage = useAppContext(
      (v) => v.requestHelpers.sendBuildChatMessage
    );
    const deleteBuildRuntimeChatMessage = useAppContext(
      (v) => v.requestHelpers.deleteBuildRuntimeChatMessage
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
    const listBuildReminders = useAppContext(
      (v) => v.requestHelpers.listBuildReminders
    );
    const createBuildReminder = useAppContext(
      (v) => v.requestHelpers.createBuildReminder
    );
    const updateBuildReminder = useAppContext(
      (v) => v.requestHelpers.updateBuildReminder
    );
    const deleteBuildReminder = useAppContext(
      (v) => v.requestHelpers.deleteBuildReminder
    );
    const getDueBuildReminders = useAppContext(
      (v) => v.requestHelpers.getDueBuildReminders
    );
    const onOpenSigninModal = useAppContext(
      (v) => v.user.actions.onOpenSigninModal
    );

    const loadBuildAiPromptsRef = useRef(loadBuildAiPrompts);
    const callBuildAiChatRef = useRef(callBuildAiChat);
    const callBuildRuntimeAiChatRef = useRef(callBuildRuntimeAiChat);
    const callBuildRuntimeAiChatStreamRef = useRef(
      callBuildRuntimeAiChatStream
    );
    const generateAiImageRef = useRef(generateAIImage);
    const listBuildArtifactsRef = useRef(listBuildArtifacts);
    const listBuildArtifactVersionsRef = useRef(listBuildArtifactVersions);
    const restoreBuildArtifactVersionRef = useRef(restoreBuildArtifactVersion);
    const queryViewerDbRef = useRef(queryViewerDb);
    const execViewerDbRef = useRef(execViewerDb);
    const getBuildApiTokenRef = useRef(getBuildApiToken);
    const getBuildApiUserRef = useRef(getBuildApiUser);
    const getBuildApiUsersRef = useRef(getBuildApiUsers);
    const getBuildDailyReflectionsRef = useRef(getBuildDailyReflections);
    const listBuildRuntimeFilesRef = useRef(listBuildRuntimeFiles);
    const deleteBuildRuntimeFileRef = useRef(deleteBuildRuntimeFile);
    const uploadBuildRuntimeFilesRef = useRef(uploadBuildRuntimeFiles);
    const getBuildMySubjectsRef = useRef(getBuildMySubjects);
    const getBuildSubjectRef = useRef(getBuildSubject);
    const getBuildSubjectCommentsRef = useRef(getBuildSubjectComments);
    const getBuildProfileCommentsRef = useRef(getBuildProfileComments);
    const getBuildProfileCommentIdsRef = useRef(getBuildProfileCommentIds);
    const getBuildProfileCommentsByIdsRef = useRef(
      getBuildProfileCommentsByIds
    );
    const getBuildProfileCommentCountsRef = useRef(
      getBuildProfileCommentCounts
    );
    const getSharedDbTopicsRef = useRef(getSharedDbTopics);
    const createSharedDbTopicRef = useRef(createSharedDbTopic);
    const getSharedDbEntriesRef = useRef(getSharedDbEntries);
    const addSharedDbEntryRef = useRef(addSharedDbEntry);
    const updateSharedDbEntryRef = useRef(updateSharedDbEntry);
    const deleteSharedDbEntryRef = useRef(deleteSharedDbEntry);
    const listBuildChatRoomsRef = useRef(listBuildChatRooms);
    const createBuildChatRoomRef = useRef(createBuildChatRoom);
    const listBuildChatMessagesRef = useRef(listBuildChatMessages);
    const sendBuildChatMessageRef = useRef(sendBuildChatMessage);
    const deleteBuildRuntimeChatMessageRef = useRef(
      deleteBuildRuntimeChatMessage
    );
    const getPrivateDbItemRef = useRef(getPrivateDbItem);
    const listPrivateDbItemsRef = useRef(listPrivateDbItems);
    const setPrivateDbItemRef = useRef(setPrivateDbItem);
    const deletePrivateDbItemRef = useRef(deletePrivateDbItem);
    const listBuildRemindersRef = useRef(listBuildReminders);
    const createBuildReminderRef = useRef(createBuildReminder);
    const updateBuildReminderRef = useRef(updateBuildReminder);
    const deleteBuildReminderRef = useRef(deleteBuildReminder);
    const getDueBuildRemindersRef = useRef(getDueBuildReminders);

    const buildApiTokenRef = useRef<{
      buildId?: number;
      token: string;
      scopes: string[];
      expiresAt: number;
    } | null>(null);
    const hydratedBuildIdRef = useRef<number | null>(null);
    const capabilitySnapshotRef = useRef<BuildCapabilitySnapshot | null>(
      capabilitySnapshot
    );
    const runtimeExplorationPlanRef =
      useRef<BuildRuntimeExplorationPlan | null>(
        normalizeRuntimeExplorationPlan(runtimeExplorationPlan)
      );
    const previewAuth = useRef({
      buildRef,
      isOwnerRef,
      userIdRef,
      usernameRef,
      profilePicUrlRef,
      guestSessionIdRef,
      buildApiTokenRef,
      getBuildApiTokenRef,
      setGuestRestrictionBannerVisible
    }).current;
    const previewRequestRefs = useRef({
      loadBuildAiPromptsRef,
      callBuildAiChatRef,
      callBuildRuntimeAiChatRef,
      callBuildRuntimeAiChatStreamRef,
      generateAiImageRef,
      queryViewerDbRef,
      execViewerDbRef,
      getBuildApiUserRef,
      getBuildApiUsersRef,
      getBuildDailyReflectionsRef,
      listBuildRuntimeFilesRef,
      deleteBuildRuntimeFileRef,
      uploadBuildRuntimeFilesRef,
      getBuildMySubjectsRef,
      getBuildSubjectRef,
      getBuildSubjectCommentsRef,
      getBuildProfileCommentsRef,
      getBuildProfileCommentIdsRef,
      getBuildProfileCommentsByIdsRef,
      getBuildProfileCommentCountsRef,
      getSharedDbTopicsRef,
      createSharedDbTopicRef,
      getSharedDbEntriesRef,
      addSharedDbEntryRef,
      updateSharedDbEntryRef,
      deleteSharedDbEntryRef,
      listBuildChatRoomsRef,
      createBuildChatRoomRef,
      listBuildChatMessagesRef,
      sendBuildChatMessageRef,
      deleteBuildRuntimeChatMessageRef,
      getPrivateDbItemRef,
      listPrivateDbItemsRef,
      setPrivateDbItemRef,
      deletePrivateDbItemRef,
      listBuildRemindersRef,
      createBuildReminderRef,
      updateBuildReminderRef,
      deleteBuildReminderRef,
      getDueBuildRemindersRef
    }).current;
    const resolvedCapabilitySnapshot = useMemo(() => {
      if (!capabilitySnapshot) return null;
      return {
        ...capabilitySnapshot,
        build: {
          ...capabilitySnapshot.build,
          isPublic: Boolean(build.isPublic)
        }
      };
    }, [build.isPublic, capabilitySnapshot]);
    const resolvedRuntimeExplorationPlan = useMemo(
      () => normalizeRuntimeExplorationPlan(runtimeExplorationPlan),
      [runtimeExplorationPlan]
    );

    const hasRuntimePreview = useMemo(() => {
      if (!runtimeOnly) return false;
      return (
        previewProjectFiles.length > 0 || String(code || '').trim().length > 0
      );
    }, [code, previewProjectFiles, runtimeOnly]);

    const runtimePreviewSrc = useMemo(() => {
      if (normalizedPreviewSrcOverride) {
        return normalizedPreviewSrcOverride;
      }
      if (!runtimeOnly || !hasRuntimePreview) return null;
      return buildPreviewBaseSrc(build);
    }, [build, hasRuntimePreview, normalizedPreviewSrcOverride, runtimeOnly]);

    const workspacePreviewSrc = useWorkspacePreviewSrc({
      build,
      runtimeOnly,
      viewMode,
      userId: resolvedUserId || null,
      previewAuth
    });
    const previewCodeSignature =
      Number(build.currentArtifactVersionId) > 0
        ? `artifact:${build.currentArtifactVersionId}`
        : `current:${build.id}:${Number(build.updatedAt) || 0}`;
    const previewHostVisible = runtimeHostVisible !== false;
    const previewFrameSuspended =
      !previewHostVisible && previewLifecycleState === 'suspended';

    useEffect(() => {
      if (previewHostVisible) {
        setPreviewLifecycleState('active');
        return;
      }

      setPreviewLifecycleState((currentState) =>
        currentState === 'active' ? 'background' : 'suspended'
      );
      const suspendTimeout = window.setTimeout(() => {
        setPreviewLifecycleState((currentState) =>
          currentState === 'background' ? 'suspended' : currentState
        );
      }, PREVIEW_HIDDEN_SUSPEND_DELAY_MS);

      return () => {
        window.clearTimeout(suspendTimeout);
      };
    }, [build.id, previewCodeSignature, previewHostVisible]);

    const {
      activePreviewFrame,
      handlePreviewFrameLoad,
      messageTargetFrameRef,
      previewCodeSignatureRef,
      previewFrameMetaRef,
      previewFrameReady,
      previewFrameSources,
      previewFrameSourcesRef,
      previewSrc,
      previewTransitioning,
      previewTransitioningRef,
      primaryIframeRef,
      secondaryIframeRef
    } = usePreviewFrameManager({
      buildId: build.id,
      runtimeOnly,
      previewCodeSignature,
      runtimePreviewSrc: previewFrameSuspended ? null : runtimePreviewSrc,
      workspacePreviewSrc:
        previewFrameSuspended
          ? null
          : normalizedPreviewSrcOverride || workspacePreviewSrc
    });
    const runtimePreviewFrameSrc = runtimeOnly
      ? previewFrameSources.primary
      : null;
    const runtimePreviewFrameNonce = runtimeOnly
      ? previewFrameMetaRef.current.primary.messageNonce
      : null;
    const shouldShowRuntimePreviewStage = Boolean(
      runtimePreviewFrameSrc || previewSrc
    );
    const shouldMountRuntimePreviewFrame = Boolean(
      runtimePreviewFrameSrc && runtimePreviewFrameNonce
    );
    const shouldShowWorkspacePreviewStage = Boolean(
      previewHostVisible ||
        previewFrameSources.primary ||
        previewFrameSources.secondary ||
        previewSrc
    );

    useEffect(() => {
      if (!onCaptureReadyChange) return;
      const ready =
        previewHostVisible &&
        !previewFrameSuspended &&
        Boolean(previewSrc) &&
        previewFrameReady[activePreviewFrame] &&
        !previewTransitioning;
      onCaptureReadyChange(ready);
    }, [
      activePreviewFrame,
      onCaptureReadyChange,
      previewFrameSuspended,
      previewFrameReady,
      previewHostVisible,
      previewSrc,
      previewTransitioning
    ]);

    useEffect(() => {
      if (!previewSrc) return;
      const message = {
        source: 'twinkle-parent',
        type: 'host-visibility:update',
        payload: {
          visible: runtimeHostVisible !== false
        }
      };
      const previewFrames = [
        {
          frame: 'primary' as const,
          window: primaryIframeRef.current?.contentWindow || null
        },
        {
          frame: 'secondary' as const,
          window: secondaryIframeRef.current?.contentWindow || null
        }
      ];
      for (const { frame, window: targetWindow } of previewFrames) {
        if (!targetWindow) continue;
        const frameSource =
          frame === 'primary'
            ? previewFrameSources.primary
            : previewFrameSources.secondary;
        const frameMessageNonce =
          frame === 'primary'
            ? previewFrameMetaRef.current.primary.messageNonce
            : previewFrameMetaRef.current.secondary.messageNonce;
        const targetOrigin = getBuildPreviewMessageTargetOrigin(
          frameSource
        );
        targetWindow.postMessage(
          {
            ...message,
            previewNonce: frameMessageNonce
          },
          targetOrigin
        );
      }
    }, [
      previewSrc,
      previewFrameReady.primary,
      previewFrameReady.secondary,
      previewFrameSources.primary,
      previewFrameSources.secondary,
      previewFrameMetaRef,
      primaryIframeRef,
      runtimeHostVisible,
      secondaryIframeRef
    ]);

    usePreviewHostBridge({
      runtimeOnly,
      buildId: build.id,
      buildIsPublic: build.isPublic,
      isOwner,
      userId: resolvedUserId || null,
      username: resolvedUsername || null,
      profilePicUrl: resolvedProfilePicUrl || null,
      resolvedCapabilitySnapshot,
      resolvedRuntimeExplorationPlan,
      capabilitySnapshotRef,
      runtimeExplorationPlanRef,
      messageTargetFrameRef,
      previewCodeSignatureRef,
      previewFrameMetaRef,
      previewFrameSourcesRef,
      previewTransitioningRef,
      primaryIframeRef,
      secondaryIframeRef,
      setRuntimeObservationState,
      previewAuth,
      requestRefs: previewRequestRefs,
      runtimeUploadsSyncRef: onRuntimeUploadsSyncRef,
      onAiUsagePolicyUpdateRef
    });

    useEffect(() => {
      const nextState = buildEmptyRuntimeObservationState({
        buildId: build.id,
        codeSignature: previewCodeSignature
      });
      runtimeObservationStateRef.current = nextState;
      setRuntimeObservationState(nextState);
    }, [build.id, previewCodeSignature]);

    useEffect(() => {
      runtimeObservationStateRef.current = runtimeObservationState;
      onRuntimeObservationChangeRef.current?.(runtimeObservationState);
    }, [runtimeObservationState]);

    useEffect(() => {
      onRuntimeObservationChangeRef.current =
        onRuntimeObservationChange || null;
    }, [onRuntimeObservationChange]);

    useEffect(() => {
      onRuntimeUploadsSyncRef.current = onRuntimeUploadsSync || null;
    }, [onRuntimeUploadsSync]);

    useEffect(() => {
      onAiUsagePolicyUpdateRef.current = onAiUsagePolicyUpdate || null;
    }, [onAiUsagePolicyUpdate]);

    useEffect(() => {
      onEditableProjectFilesStateChangeRef.current =
        onEditableProjectFilesStateChange || null;
    }, [onEditableProjectFilesStateChange]);

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
      userIdRef.current = resolvedUserId || null;
    }, [resolvedUserId]);

    useEffect(() => {
      usernameRef.current = resolvedUsername || null;
    }, [resolvedUsername]);

    useEffect(() => {
      profilePicUrlRef.current = resolvedProfilePicUrl || null;
    }, [resolvedProfilePicUrl]);

    useEffect(() => {
      buildApiTokenRef.current = null;
    }, [build.id, resolvedUserId]);

    useEffect(() => {
      if (resolvedUserId) {
        setGuestRestrictionBannerVisible(false);
      }
    }, [resolvedUserId]);

    useEffect(() => {
      capabilitySnapshotRef.current = resolvedCapabilitySnapshot;
    }, [resolvedCapabilitySnapshot]);

    useEffect(() => {
      runtimeExplorationPlanRef.current = resolvedRuntimeExplorationPlan;
    }, [resolvedRuntimeExplorationPlan]);

    useEffect(() => {
      editableProjectFilesRef.current = editableProjectFiles;
    }, [editableProjectFiles]);

    useEffect(() => {
      const shouldHydrateForBuild =
        hydratedBuildIdRef.current === null ||
        hydratedBuildIdRef.current !== build.id;
      if (!shouldHydrateForBuild) return;
      hydratedBuildIdRef.current = build.id;
      setEditableProjectFiles(persistedProjectFiles);
      setHasLocalEditableProjectFileChanges(false);
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
      setCollapsedFolders({});
      wasShowingStreamingCodeRef.current = false;
      streamingAutoFollowEnabledRef.current = false;
      autoReturnToPreviewPendingRef.current = false;
      lastStreamingFocusFilePathRef.current = null;
    }, [build.id, persistedProjectFiles, persistedProjectFilesSignature]);

    useEffect(() => {
      if (hasUnsavedProjectFileChanges) return;
      setEditableProjectFiles(persistedProjectFiles);
      setHasLocalEditableProjectFileChanges(false);
      setActiveFilePath((prev) => {
        const hasPrev = persistedProjectFiles.some(
          (file) => file.path === prev
        );
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
      const justStartedStreaming =
        isShowingStreamingCode && !wasShowingStreamingCodeRef.current;
      const justStoppedStreaming =
        !isShowingStreamingCode && wasShowingStreamingCodeRef.current;
      wasShowingStreamingCodeRef.current = isShowingStreamingCode;

      if (justStartedStreaming) {
        const isMobileWorkspace =
          typeof window !== 'undefined' &&
          typeof window.matchMedia === 'function' &&
          window.matchMedia(`(max-width: ${mobileMaxWidth})`).matches;

        streamingAutoFollowEnabledRef.current = true;
        autoReturnToPreviewPendingRef.current = false;
        // Keep the live simulator visible on mobile while Lumine streams code.
        if (!isMobileWorkspace && viewMode !== 'code') {
          setViewMode('code');
        }
      } else if (justStoppedStreaming) {
        streamingAutoFollowEnabledRef.current = false;
        autoReturnToPreviewPendingRef.current = true;
        lastStreamingFocusFilePathRef.current = null;
      }
    }, [isShowingStreamingCode, viewMode]);

    useEffect(() => {
      if (runtimeOnly) return;
      if (isShowingStreamingCode) return;
      if (!autoReturnToPreviewPendingRef.current) return;
      autoReturnToPreviewPendingRef.current = false;
      if (viewMode !== 'preview') {
        setViewMode('preview');
      }
    }, [
      isShowingStreamingCode,
      runtimeOnly,
      viewMode
    ]);

    useEffect(() => {
      if (!isShowingStreamingCode || !streamingFocusFilePath) return;
      const nextPath = normalizeProjectFilePath(streamingFocusFilePath);
      if (lastStreamingFocusFilePathRef.current === nextPath) return;
      lastStreamingFocusFilePathRef.current = nextPath;
      if (!streamingAutoFollowEnabledRef.current) return;
      setActiveFilePath((prev) => {
        const exists = displayedProjectFiles.some(
          (file) => file.path === nextPath
        );
        if (!exists) return prev;
        return nextPath;
      });
    }, [displayedProjectFiles, isShowingStreamingCode, streamingFocusFilePath]);

    useEffect(() => {
      onEditableProjectFilesStateChangeRef.current?.({
        files: projectFilesForParent,
        hasUnsavedChanges: hasUnsavedProjectFileChanges,
        saving: savingProjectFiles
      });
    }, [
      projectFilesForParent,
      hasUnsavedProjectFileChanges,
      savingProjectFiles
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

    function setEditableFiles(
      nextFiles: EditableProjectFile[],
      options?: { markDirty?: boolean }
    ) {
      const sorted = [...nextFiles].sort((a, b) =>
        a.path.localeCompare(b.path)
      );
      editableProjectFilesRef.current = sorted;
      setEditableProjectFiles(sorted);
      setHasLocalEditableProjectFileChanges(Boolean(options?.markDirty));
      setActiveFilePath((prev) => {
        if (sorted.some((file) => file.path === prev)) return prev;
        return (
          getPreferredIndexPath(sorted) || sorted[0]?.path || '/index.html'
        );
      });
    }

    function setSavingProjectFilesState(next: boolean) {
      savingProjectFilesRef.current = next;
      setSavingProjectFiles(next);
    }

    function setDownloadingProjectArchiveState(next: boolean) {
      downloadingProjectArchiveRef.current = next;
      setDownloadingProjectArchive(next);
    }

    function areProjectFileMutationsLocked() {
      return (
        savingProjectFilesRef.current || downloadingProjectArchiveRef.current
      );
    }

    function isActiveBuildId(targetBuildId: number) {
      return Number(buildRef.current?.id || 0) === Number(targetBuildId || 0);
    }

    async function ensureBuildApiTokenForBuild(
      requiredScopes: string[],
      targetBuildId: number
    ) {
      if (
        !Number.isFinite(Number(targetBuildId)) ||
        Number(targetBuildId) <= 0
      ) {
        throw new Error('Build not found');
      }
      const now = Math.floor(Date.now() / 1000);
      const cached = buildApiTokenRef.current;
      if (
        cached &&
        cached.buildId === targetBuildId &&
        cached.expiresAt - 30 > now &&
        requiredScopes.every((scope) => cached.scopes.includes(scope))
      ) {
        return cached.token;
      }

      const requestedScopes = Array.from(
        new Set<string>([
          ...(cached?.buildId === targetBuildId ? cached.scopes : []),
          ...requiredScopes
        ])
      );
      const result = await getBuildApiTokenRef.current({
        buildId: targetBuildId,
        scopes: requestedScopes
      });
      if (!result?.token) {
        throw new Error('Failed to obtain API token');
      }
      buildApiTokenRef.current = {
        buildId: targetBuildId,
        token: result.token,
        scopes: result.scopes || requestedScopes,
        expiresAt: result.expiresAt || now + 600
      };
      return result.token;
    }

    function cloneLatestEditableProjectFiles() {
      return readLatestEditableProjectFiles(editableProjectFilesRef).map(
        (file) => ({
          path: file.path,
          content: file.content
        })
      );
    }

    function getProjectFileCaseCollisionError(files: EditableProjectFile[]) {
      const collisionPaths =
        listCaseInsensitiveProjectFileCollisionPaths(files);
      if (collisionPaths.length === 0) {
        return null;
      }
      return `Project files cannot differ only by letter casing: ${summarizeUploadedFileNames(
        collisionPaths
      )}`;
    }

    function handleViewModeChange(nextMode: WorkspaceViewMode) {
      if (nextMode === viewMode) return;
      if (nextMode === 'code' && !codeWorkspaceAvailable) return;
      if (isShowingStreamingCode) {
        streamingAutoFollowEnabledRef.current = nextMode === 'code';
      }
      setViewMode(nextMode);
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
    }

    function handleEditableFileContentChange(content: string) {
      if (!isOwner || !activeFile || areProjectFileMutationsLocked()) return;
      setEditableFiles(
        editableProjectFiles.map((file) =>
          file.path === activeFile.path ? { ...file, content } : file
        ),
        { markDirty: true }
      );
      setProjectFileError('');
    }

    function handleAddProjectFile() {
      if (!isOwner || areProjectFileMutationsLocked()) return;
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
      setEditableFiles(nextFiles, { markDirty: true });
      setActiveFilePath(normalizedPath);
      setSelectedFolderPath(null);
      setNewFilePath('');
      setProjectFileError('');
    }

    async function handleUploadProjectFiles(
      uploadInput: FileList | File[] | null,
      options?: {
        requireRelativePaths?: boolean;
        requireRootIndexHtml?: boolean;
        restoreExportedRuntimeAssets?: boolean;
        restoreReferencedLocalAssets?: boolean;
        targetFolderPath?: string | null;
      }
    ) {
      if (!isOwner || areProjectFileMutationsLocked()) {
        return {
          success: false,
          importedCount: 0,
          error: 'Project files are temporarily locked.'
        };
      }
      const uploadedFiles = normalizeUploadInputFiles(uploadInput);
      if (uploadedFiles.length === 0) {
        return {
          success: false,
          importedCount: 0,
          error: 'No files were selected.'
        };
      }
      const selectedFolderPathAtStart =
        options && Object.prototype.hasOwnProperty.call(options, 'targetFolderPath')
          ? options.targetFolderPath ?? null
          : selectedFolderPath;

      if (
        options?.requireRelativePaths &&
        uploadedFiles.some((file) => !String(file.webkitRelativePath || '').trim())
      ) {
        const message =
          'This browser did not preserve folder paths for the selected project. Try importing the folder again.';
        setProjectFileError(message);
        return {
          success: false,
          importedCount: 0,
          error: message
        };
      }

      const resolvedUploadEntries = uploadedFiles.map((file) => {
        const normalizedPath = resolveUploadedProjectFilePath({
          file,
          selectedFolderPath: selectedFolderPathAtStart
        });
        const importedRuntimeAttachmentSourcePath =
          getImportedRuntimeAttachmentSourcePath(file);
        const isValidPath =
          Boolean(normalizedPath) &&
          normalizedPath !== '/' &&
          !normalizedPath.endsWith('/');
        return {
          file,
          normalizedPath,
          isValidPath,
          isProjectTextFile: isSupportedBuildProjectUploadFile(file),
          isSupportedAssetFile: isSupportedBuildAssetUploadFile(file),
          importedRuntimeAttachmentSourcePath,
          isImportedRuntimeAttachment:
            isValidPath && Boolean(importedRuntimeAttachmentSourcePath)
        };
      });

      const textUploadEntries = resolvedUploadEntries.filter(
        (entry) =>
          entry.isProjectTextFile &&
          entry.isValidPath &&
          !(options?.restoreExportedRuntimeAssets && entry.isImportedRuntimeAttachment)
      );
      const importableRuntimeAttachmentEntries =
        options?.restoreExportedRuntimeAssets
          ? resolvedUploadEntries.filter(
              (entry) => entry.isValidPath && entry.isImportedRuntimeAttachment
            )
          : [];
      const importableLocalAssetEntries = options?.restoreReferencedLocalAssets
        ? resolvedUploadEntries.filter(
            (entry) =>
              entry.isValidPath &&
              entry.isSupportedAssetFile &&
              !entry.isProjectTextFile &&
              !entry.isImportedRuntimeAttachment
          )
        : [];
      const unsupportedFileNames = resolvedUploadEntries
        .filter(
          (entry) =>
            !entry.isProjectTextFile &&
            !importableRuntimeAttachmentEntries.some(
              (candidate) => candidate.file === entry.file
            ) &&
            !importableLocalAssetEntries.some(
              (candidate) => candidate.file === entry.file
            )
        )
        .map((entry) => entry.file.name);

      if (textUploadEntries.length === 0) {
        const message = `Only text project files are supported right now. Unsupported: ${summarizeUploadedFileNames(
          unsupportedFileNames
        )}`;
        setProjectFileError(message);
        return {
          success: false,
          importedCount: 0,
          error: message
        };
      }

      const uploadedProjectFiles: EditableProjectFile[] = [];
      const failedFileNames: string[] = resolvedUploadEntries
        .filter(
          (entry) =>
            entry.isProjectTextFile &&
            !entry.isValidPath &&
            !(options?.restoreExportedRuntimeAssets && entry.isImportedRuntimeAttachment)
        )
        .map((entry) => entry.file.name);

      for (const entry of textUploadEntries) {
        try {
          const content = await entry.file.text();
          uploadedProjectFiles.push({
            path: entry.normalizedPath,
            content
          });
        } catch (error) {
          console.error('Failed to read uploaded project file', error);
          failedFileNames.push(entry.file.name);
        }
      }

      if (uploadedProjectFiles.length === 0) {
        const message =
          failedFileNames.length > 0
            ? `Failed to read: ${summarizeUploadedFileNames(failedFileNames)}`
            : 'No valid project files were uploaded.';
        setProjectFileError(message);
        return {
          success: false,
          importedCount: 0,
          error: message
        };
      }

      const uploadByPath = new Map<string, string>();
      for (const file of uploadedProjectFiles) {
        uploadByPath.set(file.path, file.content);
      }
      let dedupedUploads = Array.from(uploadByPath.entries()).map(
        ([path, content]) => ({
          path,
          content
        })
      );
      if (
        options?.requireRootIndexHtml &&
        !dedupedUploads.some((file) => isIndexHtmlPath(file.path))
      ) {
        const message =
          'Imported project folders must contain a root index.html or index.htm file.';
        setProjectFileError(message);
        return {
          success: false,
          importedCount: 0,
          error: message
        };
      }
      const latestEditableProjectFiles = readLatestEditableProjectFiles(
        editableProjectFilesRef
      );
      const collisionPaths = dedupedUploads
        .filter((file) =>
          latestEditableProjectFiles.some(
            (existingFile) => existingFile.path === file.path
          )
        )
        .map((file) => file.path)
        .sort((a, b) => a.localeCompare(b));

      if (collisionPaths.length > 0) {
        const shouldReplace = window.confirm(
          `Replace existing files?\n\n${summarizeUploadedFileNames(
            collisionPaths
          )}`
        );
        if (!shouldReplace) {
          const message = 'Upload cancelled. Existing files were not replaced.';
          setProjectFileError(message);
          return {
            success: false,
            importedCount: 0,
            error: message
          };
        }
      }
      const mergedProjectFilesForReferenceDetection = mergeEditableProjectFiles(
        latestEditableProjectFiles,
        dedupedUploads
      );
      const mergedProjectFileContentByPath = new Map(
        mergedProjectFilesForReferenceDetection.map((file) => [
          file.path,
          file.content || ''
        ])
      );
      const {
        documentBaseFilePathByScriptPath,
        documentBaseFilePathsByScriptPath
      } = buildImportedRuntimeAttachmentDocumentBasePathsByScript(
        mergedProjectFilesForReferenceDetection
      );

      const uploadWarnings: string[] = [];
      let runtimeAssetToken: string | null = null;
      const restoredRuntimeAssets: PreviewRuntimeUploadAsset[] = [];
      const uploadTargetBuildId = Number(buildRef.current?.id || build.id || 0);

      function didUploadTargetBuildChange() {
        return !isActiveBuildId(uploadTargetBuildId);
      }
      if (
        importableRuntimeAttachmentEntries.length > 0 ||
        importableLocalAssetEntries.length > 0
      ) {
        const referencedRuntimeAttachmentEntries =
          importableRuntimeAttachmentEntries.filter((entry) =>
            mergedProjectFilesForReferenceDetection.some((file) =>
              importedProjectFileReferencesRuntimeAttachment({
                filePath: file.path,
                content: file.content,
                attachmentPath: entry.normalizedPath,
                documentBaseFilePath:
                  documentBaseFilePathByScriptPath.get(
                    normalizeProjectFilePath(file.path)
                  ) || null,
                documentBaseFilePaths:
                  documentBaseFilePathsByScriptPath.get(
                    normalizeProjectFilePath(file.path)
                  ) || null
              })
            )
          );
        const referencedLocalAssetEntries = importableLocalAssetEntries.filter(
          (entry) =>
            mergedProjectFilesForReferenceDetection.some((file) =>
              importedProjectFileReferencesLocalAsset({
                filePath: file.path,
                content: file.content,
                assetPath: entry.normalizedPath,
                documentBaseFilePath:
                  documentBaseFilePathByScriptPath.get(
                    normalizeProjectFilePath(file.path)
                  ) || null,
                documentBaseFilePaths:
                  documentBaseFilePathsByScriptPath.get(
                    normalizeProjectFilePath(file.path)
                  ) || null
              })
            )
        );
        const skippedLocalAssetNames = importableLocalAssetEntries
          .filter(
            (entry) =>
              !referencedLocalAssetEntries.some(
                (candidate) => candidate.file === entry.file
              )
          )
          .map((entry) => entry.file.name);

        if (
          referencedRuntimeAttachmentEntries.length > 0 ||
          referencedLocalAssetEntries.length > 0
        ) {
          const uploadedRuntimeAssets: PreviewRuntimeUploadAsset[] = [];
          const replacementUrlByAttachmentPath = new Map<string, string>();

          try {
            runtimeAssetToken = await ensureBuildApiTokenForBuild(
              ['files:read', 'files:write'],
              uploadTargetBuildId
            );

            const referencedOriginalEntriesByAssetId = new Map<
              string,
              (typeof referencedRuntimeAttachmentEntries)[number]
            >();
            for (const entry of referencedRuntimeAttachmentEntries) {
              const originalAssetId =
                getImportedRuntimeOriginalAttachmentAssetId(
                  entry.importedRuntimeAttachmentSourcePath ||
                    entry.normalizedPath
                );
              if (originalAssetId) {
                referencedOriginalEntriesByAssetId.set(originalAssetId, entry);
              }
            }

            const pairedThumbEntriesByOriginalAssetId = new Map<
              string,
              Array<(typeof referencedRuntimeAttachmentEntries)[number]>
            >();
            const runtimeAttachmentEntriesToUpload: Array<
              (typeof referencedRuntimeAttachmentEntries)[number]
            > = [];

            for (const entry of referencedRuntimeAttachmentEntries) {
              const thumbAssetId = getImportedRuntimeThumbAttachmentAssetId(
                entry.importedRuntimeAttachmentSourcePath ||
                  entry.normalizedPath
              );
              if (
                thumbAssetId &&
                referencedOriginalEntriesByAssetId.has(thumbAssetId)
              ) {
                const nextEntries =
                  pairedThumbEntriesByOriginalAssetId.get(thumbAssetId) || [];
                nextEntries.push(entry);
                pairedThumbEntriesByOriginalAssetId.set(
                  thumbAssetId,
                  nextEntries
                );
                continue;
              }
              runtimeAttachmentEntriesToUpload.push(entry);
            }

            const deferredThumbEntries: Array<
              (typeof referencedRuntimeAttachmentEntries)[number]
            > = [];

            async function uploadRuntimeAttachmentEntry(
              entry: (typeof referencedRuntimeAttachmentEntries)[number]
            ) {
              const payload = await uploadBuildRuntimeFilesRef.current({
                buildId: uploadTargetBuildId,
                files: [entry.file],
                token: runtimeAssetToken
              });
              const asset = Array.isArray(payload?.assets)
                ? payload.assets[0]
                : null;
              const runtimeAttachmentSourcePath =
                entry.importedRuntimeAttachmentSourcePath ||
                entry.normalizedPath;
              const replacementUrl = runtimeAttachmentSourcePath.startsWith(
                IMPORTED_RUNTIME_THUMB_ATTACHMENT_PATH_PREFIX
              )
                ? String(asset?.thumbUrl || asset?.url || '')
                : String(asset?.url || '');

              if (!asset || !replacementUrl) {
                throw new Error(
                  `Failed to restore bundled asset "${entry.file.name}".`
                );
              }

              uploadedRuntimeAssets.push(asset);
              restoredRuntimeAssets.push(asset);
              replacementUrlByAttachmentPath.set(
                entry.normalizedPath,
                replacementUrl
              );

              return asset;
            }

            for (const entry of runtimeAttachmentEntriesToUpload) {
              const asset = await uploadRuntimeAttachmentEntry(entry);
              const originalAssetId = getImportedRuntimeOriginalAttachmentAssetId(
                entry.importedRuntimeAttachmentSourcePath ||
                  entry.normalizedPath
              );
              if (!originalAssetId) {
                continue;
              }
              const pairedThumbEntries =
                pairedThumbEntriesByOriginalAssetId.get(originalAssetId) || [];
              if (pairedThumbEntries.length === 0) {
                continue;
              }
              const pairedThumbUrl = String(asset?.thumbUrl || '');
              if (!pairedThumbUrl) {
                deferredThumbEntries.push(...pairedThumbEntries);
                continue;
              }
              for (const thumbEntry of pairedThumbEntries) {
                replacementUrlByAttachmentPath.set(
                  thumbEntry.normalizedPath,
                  pairedThumbUrl
                );
              }
            }

            for (const thumbEntry of deferredThumbEntries) {
              await uploadRuntimeAttachmentEntry(thumbEntry);
            }

            for (const entry of referencedLocalAssetEntries) {
              await uploadRuntimeAttachmentEntry(entry);
            }
          } catch (error: any) {
            await cleanupRestoredRuntimeAssets(
              uploadedRuntimeAssets,
              runtimeAssetToken,
              uploadTargetBuildId
            );
            console.error('Failed to restore bundled runtime assets', error);
            const message =
              error?.message || 'Failed to restore imported media assets.';
            setProjectFileError(message);
            return {
              success: false,
              importedCount: 0,
              error: message
            };
          }

          const rewrittenMergedProjectFiles =
            rewriteImportedProjectFilesWithRuntimeAssetUrls({
              files: mergedProjectFilesForReferenceDetection,
              replacementUrlByAttachmentPath,
              documentBaseFilePathByScriptPath,
              documentBaseFilePathsByScriptPath
            });
          const nextUploadsByPath = new Map(
            dedupedUploads.map((file) => [file.path, file.content || ''])
          );
          for (const file of rewrittenMergedProjectFiles) {
            const previousContent =
              mergedProjectFileContentByPath.get(file.path) ?? '';
            const nextContent = file.content || '';
            if (previousContent !== nextContent) {
              nextUploadsByPath.set(file.path, nextContent);
            }
          }
          dedupedUploads = Array.from(nextUploadsByPath.entries()).map(
            ([path, content]) => ({
              path,
              content
            })
          );
        }
        if (skippedLocalAssetNames.length > 0) {
          uploadWarnings.push(
            `Skipped local media files that were not referenced by imported code: ${summarizeUploadedFileNames(
              skippedLocalAssetNames
            )}`
          );
        }
      }

      const nextEditableFiles = mergeEditableProjectFiles(
        readLatestEditableProjectFiles(editableProjectFilesRef),
        dedupedUploads
      );
      const nextPersistedFiles = mergeEditableProjectFiles(
        persistedProjectFiles,
        dedupedUploads
      );
      function buildProjectImportWarningText(
        additionalWarnings: string[] = []
      ) {
        const nextWarnings = [...uploadWarnings];
        if (unsupportedFileNames.length > 0) {
          nextWarnings.push(
            `Skipped unsupported files: ${summarizeUploadedFileNames(
              unsupportedFileNames
            )}`
          );
        }
        if (failedFileNames.length > 0) {
          nextWarnings.push(
            `Failed to read: ${summarizeUploadedFileNames(failedFileNames)}`
          );
        }
        nextWarnings.push(
          ...additionalWarnings
            .map((warning) => String(warning || '').trim())
            .filter(Boolean)
        );
        return nextWarnings.join(' ');
      }
      const collisionError = getProjectFileCaseCollisionError(nextEditableFiles);
      if (collisionError) {
        await cleanupRestoredRuntimeAssets(
          restoredRuntimeAssets,
          runtimeAssetToken,
          uploadTargetBuildId
        );
        setProjectFileError(collisionError);
        return {
          success: false,
          importedCount: 0,
          error: collisionError
        };
      }
      const preferredUploadedPath =
        dedupedUploads.find((file) => isIndexHtmlPath(file.path))?.path ||
        dedupedUploads[0]?.path ||
        getPreferredIndexPath(nextEditableFiles) ||
        nextEditableFiles[0]?.path ||
        '/index.html';

      if (runtimeAssetToken && restoredRuntimeAssets.length > 0) {
        const saveResult = await saveEditableProjectFilesWithTracking({
          files: nextPersistedFiles,
          fallbackError: 'Failed to save imported project files',
          targetBuildId: uploadTargetBuildId,
          targetBuildCode: code
        });
        if (!saveResult.success) {
          await cleanupRestoredRuntimeAssets(
            restoredRuntimeAssets,
            runtimeAssetToken,
            uploadTargetBuildId
          );
          return {
            success: false,
            importedCount: 0,
            error:
              saveResult.error || 'Failed to save imported project files.'
          };
        }
        if (didUploadTargetBuildChange()) {
          const warningText = buildProjectImportWarningText([
            'Import finished on the previous build because you switched builds before it completed.'
          ]);
          setProjectFileError(warningText);
          return {
            success: true,
            importedCount: dedupedUploads.length,
            warningText
          };
        }
        // Keep unrelated draft edits local instead of silently committing them
        // just because bundled runtime assets needed an immediate save.
        setEditableFiles(nextEditableFiles, { markDirty: true });
      } else {
        if (didUploadTargetBuildChange()) {
          return {
            success: false,
            importedCount: 0,
            error:
              'Build changed while the import was in progress. Please retry on the active build.'
          };
        }
        setEditableFiles(nextEditableFiles, { markDirty: true });
      }
      setActiveFilePath(preferredUploadedPath);
      setSelectedFolderPath(null);
      setNewFilePath('');

      if (runtimeAssetToken) {
        await syncCurrentBuildRuntimeUploads(runtimeAssetToken, uploadTargetBuildId);
      }
      const warningText = buildProjectImportWarningText();
      setProjectFileError(warningText);
      return {
        success: true,
        importedCount: dedupedUploads.length,
        warningText
      };
    }

    async function handleImportProjectFolder(fileList: FileList | null) {
      await handleUploadProjectFiles(fileList, {
        requireRelativePaths: true,
        requireRootIndexHtml: !selectedFolderPath,
        restoreExportedRuntimeAssets: true,
        restoreReferencedLocalAssets: true
      });
    }

    async function syncCurrentBuildRuntimeUploads(
      token: string,
      targetBuildId = Number(buildRef.current?.id || build.id || 0)
    ) {
      try {
        const payload = await listBuildRuntimeFilesRef.current({
          buildId: targetBuildId,
          limit: 30,
          token
        });
        if (!isActiveBuildId(targetBuildId)) {
          return payload;
        }
        setWorkspaceRuntimeAssets(
          Array.isArray(payload?.assets) ? payload.assets : []
        );
        onRuntimeUploadsSyncRef.current?.({
          assets: Array.isArray(payload?.assets) ? payload.assets : [],
          nextCursor:
            Number.isFinite(Number(payload?.nextCursor)) &&
            Number(payload?.nextCursor) > 0
              ? Math.floor(Number(payload.nextCursor))
              : null,
          usage: payload?.usage || null
        });
      } catch (error) {
        console.error(
          'Failed to sync current build assets after upload',
          error
        );
      }
    }

    async function cleanupRestoredRuntimeAssets(
      assets: PreviewRuntimeUploadAsset[],
      token: string | null,
      targetBuildId = Number(buildRef.current?.id || build.id || 0)
    ) {
      if (!token || assets.length === 0) {
        return;
      }
      for (const asset of assets) {
        await deleteBuildRuntimeFileRef.current({
          buildId: targetBuildId,
          assetId: asset.id,
          token
        }).catch(() => {});
      }
      await syncCurrentBuildRuntimeUploads(token, targetBuildId).catch((error) => {
        console.error(
          'Failed to sync runtime uploads after cleanup of imported assets',
          error
        );
      });
    }

    useEffect(() => {
      if (!isOwner || runtimeOnly) return;
      let cancelled = false;

      async function loadWorkspaceRuntimeAssets() {
        try {
          const token = await ensureBuildApiToken(['files:read'], previewAuth);
          const payload = await listBuildRuntimeFilesRef.current({
            buildId: build.id,
            limit: 30,
            token
          });
          if (cancelled) return;
          const nextAssets = Array.isArray(payload?.assets)
            ? payload.assets
            : [];
          setWorkspaceRuntimeAssets(nextAssets);
          onRuntimeUploadsSyncRef.current?.({
            assets: nextAssets,
            nextCursor:
              Number.isFinite(Number(payload?.nextCursor)) &&
              Number(payload?.nextCursor) > 0
                ? Math.floor(Number(payload.nextCursor))
                : null,
            usage: payload?.usage || null
          });
        } catch (error) {
          if (cancelled) return;
          console.error('Failed to load current build assets', error);
        }
      }

      void loadWorkspaceRuntimeAssets();
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [build.id, isOwner, runtimeOnly]);

    async function handleUploadProjectAssets(
      uploadInput: FileList | File[] | null
    ) {
      if (!isOwner || areProjectFileMutationsLocked()) {
        return {
          success: false,
          uploadedCount: 0,
          error: 'Project files are temporarily locked.'
        };
      }
      const uploadedFiles = normalizeUploadInputFiles(uploadInput);
      if (uploadedFiles.length === 0) {
        return {
          success: false,
          uploadedCount: 0,
          error: 'No files were selected.'
        };
      }

      const supportedFiles = uploadedFiles.filter(
        isSupportedBuildAssetUploadFile
      );
      const unsupportedFileNames = uploadedFiles
        .filter((file) => !isSupportedBuildAssetUploadFile(file))
        .map((file) => file.name);

      if (supportedFiles.length === 0) {
        const message = `Only image and audio assets are supported right now. Unsupported: ${summarizeUploadedFileNames(
          unsupportedFileNames
        )}`;
        setProjectFileError(message);
        return {
          success: false,
          uploadedCount: 0,
          error: message
        };
      }

      setProjectFileError('');

      try {
        const uploadTargetBuildId = Number(buildRef.current?.id || build.id || 0);
        const token = await ensureBuildApiTokenForBuild(
          ['files:read', 'files:write'],
          uploadTargetBuildId
        );
        const payload = await uploadBuildRuntimeFilesRef.current({
          buildId: uploadTargetBuildId,
          files: supportedFiles,
          token
        });
        await syncCurrentBuildRuntimeUploads(token, uploadTargetBuildId);
        const failedUploads = Array.isArray(payload?.failed)
          ? payload.failed
          : [];
        const warnings: string[] = [];
        if (unsupportedFileNames.length > 0) {
          warnings.push(
            `Skipped unsupported assets: ${summarizeUploadedFileNames(
              unsupportedFileNames
            )}`
          );
        }
        if (failedUploads.length > 0) {
          warnings.push(
            `Some assets failed to upload: ${summarizeUploadedFileNames(
              failedUploads.map((entry: any) => entry.fileName)
            )}`
          );
        }
        if (!isActiveBuildId(uploadTargetBuildId)) {
          const warningText = [
            ...warnings,
            'Asset upload finished on the previous build because you switched builds before it completed.'
          ].join(' ');
          setProjectFileError(warningText);
          return {
            success: true,
            uploadedCount: Array.isArray(payload?.assets) ? payload.assets.length : 0,
            warningText
          };
        }
        if (Array.isArray(payload?.assets) && payload.assets.length > 0) {
          onOpenRuntimeUploadsManager?.();
        }
        const warningText = warnings.join(' ');
        setProjectFileError(warningText);
        return {
          success: true,
          uploadedCount: Array.isArray(payload?.assets) ? payload.assets.length : 0,
          warningText
        };
      } catch (error: any) {
        console.error('Failed to upload project assets', error);
        const message = error?.message || 'Failed to upload project assets.';
        setProjectFileError(message);
        return {
          success: false,
          uploadedCount: 0,
          error: message
        };
      }
    }

    function handleDeleteProjectFile(filePath: string) {
      if (!isOwner || areProjectFileMutationsLocked()) return;
      if (isIndexHtmlPath(filePath)) {
        setProjectFileError('Cannot delete /index.html');
        return;
      }
      const nextFiles = editableProjectFiles.filter(
        (file) => file.path !== filePath
      );
      if (nextFiles.length === editableProjectFiles.length) return;
      if (!window.confirm(`Delete ${filePath}?`)) return;
      setEditableFiles(nextFiles, { markDirty: true });
      setProjectFileError('');
    }

    function handleRenameOrMoveActiveFile() {
      if (!isOwner || !activeFile || areProjectFileMutationsLocked()) return;
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
        // Replace the destination file automatically. Restore history is the
        // safety net for mistaken overwrites.
      }
      if (normalizedPath === activeFile.path) {
        setProjectFileError('');
        return;
      }
      const nextFiles = editableProjectFiles
        .filter(
          (file) =>
            file.path !== normalizedPath || file.path === activeFile.path
        )
        .map((file) =>
          file.path === activeFile.path
            ? { ...file, path: normalizedPath }
            : file
        );
      setEditableFiles(nextFiles, { markDirty: true });
      setActiveFilePath(normalizedPath);
      setSelectedFolderPath(null);
      setRenamePathInput(normalizedPath);
      setProjectFileError('');
    }

    function handleMoveSelectedFolder() {
      if (!isOwner || !selectedFolderPath || areProjectFileMutationsLocked()) {
        return;
      }
      const sourceFolder = normalizeProjectFilePath(selectedFolderPath);
      const targetFolder = normalizeProjectFilePath(folderMoveTargetPath);
      if (!targetFolder || targetFolder === '/') {
        setProjectFileError('Enter a valid target folder like /src/ui');
        return;
      }
      if (sourceFolder === targetFolder) {
        setProjectFileError('');
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
      const remappedTargetPaths = new Set(
        remappedFiles.map((file) => file.path)
      );
      const conflictPaths = editableProjectFiles
        .filter(
          (file) =>
            !movedSourcePaths.has(file.path) &&
            remappedTargetPaths.has(file.path)
        )
        .map((file) => file.path)
        .sort((a, b) => a.localeCompare(b));

      const conflictSet = new Set(conflictPaths);
      const retainedFiles = editableProjectFiles.filter((file) => {
        if (movedSourcePaths.has(file.path)) return false;
        if (conflictSet.has(file.path)) return false;
        return true;
      });
      const merged = [...retainedFiles, ...remappedFiles];
      const deduped = new Map<string, string>();
      for (const file of merged) {
        deduped.set(file.path, file.content);
      }
      const nextFiles = Array.from(deduped.entries()).map(
        ([path, content]) => ({
          path,
          content
        })
      );

      setEditableFiles(nextFiles, { markDirty: true });
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
    }

    async function handleSaveEditableProjectFiles() {
      if (
        !isOwner ||
        areProjectFileMutationsLocked() ||
        !hasUnsavedProjectFileChanges
      ) {
        return;
      }
      const saveResult = await saveEditableProjectFilesWithTracking({
        files: cloneLatestEditableProjectFiles(),
        fallbackError: 'Failed to save project files'
      });
      if (!saveResult.success) {
        return;
      }
    }

    async function saveEditableProjectFilesWithTracking({
      files,
      fallbackError,
      targetBuildId,
      targetBuildCode
    }: {
      files: EditableProjectFile[];
      fallbackError: string;
      targetBuildId?: number | null;
      targetBuildCode?: string | null;
    }) {
      const collisionError = getProjectFileCaseCollisionError(files);
      if (collisionError) {
        setProjectFileError(collisionError);
        return {
          success: false,
          error: collisionError
        };
      }

      const savedSignature = serializeEditableProjectFiles(files);
      setSavingProjectFilesState(true);
      setProjectFileError('');
      try {
        const result = await onSaveProjectFiles(files, {
          targetBuildId,
          targetBuildCode
        });
        if (!result?.success) {
          const message = result?.error || fallbackError;
          setProjectFileError(message);
          return {
            success: false,
            error: message
          };
        }
        setProjectFileError('');
        return {
          success: true,
          savedSignature
        };
      } finally {
        setSavingProjectFilesState(false);
      }
    }

    async function ensureLatestEditableProjectFilesSavedForExport() {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const files = cloneLatestEditableProjectFiles();
        const saveResult = await saveEditableProjectFilesWithTracking({
          files,
          fallbackError: 'Failed to save project files before export'
        });
        if (!saveResult?.success) {
          return saveResult;
        }

        const latestSignature = serializeEditableProjectFiles(
          cloneLatestEditableProjectFiles()
        );
        if (latestSignature === saveResult.savedSignature) {
          return {
            success: true
          };
        }
      }

      const message =
        'Project files changed while export was preparing. Please stop editing for a moment and try again.';
      setProjectFileError(message);
      return {
        success: false,
        error: message
      };
    }

    const projectFilesLocked = savingProjectFiles || downloadingProjectArchive;

    async function handleDownloadProjectArchive() {
      if (
        !isOwner ||
        isShowingStreamingCode ||
        areProjectFileMutationsLocked()
      ) {
        return;
      }

      setProjectFileError('');
      setDownloadingProjectArchiveState(true);
      try {
        if (hasUnsavedProjectFileChanges) {
          const saveResult =
            await ensureLatestEditableProjectFilesSavedForExport();
          if (!saveResult?.success) {
            return;
          }
        }

        const archiveBytes = await downloadBuildProjectArchive(build.id);
        if (!(archiveBytes instanceof ArrayBuffer)) {
          throw new Error('Failed to download the exported project zip');
        }

        triggerBrowserDownload({
          bytes: archiveBytes,
          fileName: `${buildProjectExportBaseName(build.title, build.id)}.zip`,
          mimeType: 'application/zip'
        });
      } catch (error: any) {
        console.error('Failed to download build project archive:', error);
        setProjectFileError(
          error?.message || 'Failed to download the exported project zip'
        );
      } finally {
        setDownloadingProjectArchiveState(false);
      }
    }

    useEffect(() => {
      if (historyOpen) {
        void loadVersions();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [historyOpen, artifactId, build.currentArtifactVersionId]);

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
          onApplyRestoredProjectFiles(restoredProjectFiles, restoredCode, {
            artifactVersionId: result?.versionId ?? versionId,
            primaryArtifactId: artifactId,
            contributionStatus: result?.contributionStatus
          });
          const restoredEditableFiles = buildEditableProjectFiles({
            code: restoredCode,
            projectFiles: restoredProjectFiles
          });
          setEditableProjectFiles(restoredEditableFiles);
          setHasLocalEditableProjectFileChanges(false);
          setActiveFilePath(
            getPreferredIndexPath(restoredEditableFiles) ||
              restoredEditableFiles[0]?.path ||
              '/index.html'
          );
          setProjectFileError('');
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

    return (
      <div
        className={`${runtimeOnly ? runtimePanelClass : panelClass}${className ? ` ${className}` : ''}`}
      >
        <input
          ref={projectFileInputRef}
          type="file"
          multiple
          accept={BUILD_PROJECT_UPLOAD_ACCEPT}
          className={css`
            display: none;
          `}
          onChange={(e) => {
            void handleUploadProjectFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={projectFolderInputRef}
          type="file"
          multiple
          className={css`
            display: none;
          `}
          onChange={(e) => {
            void handleImportProjectFolder(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={projectAssetInputRef}
          type="file"
          multiple
          accept={BUILD_PROJECT_ASSET_UPLOAD_ACCEPT}
          className={css`
            display: none;
          `}
          onChange={(e) => {
            void handleUploadProjectAssets(e.target.files);
            e.target.value = '';
          }}
        />
        {!runtimeOnly && (
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
              <SegmentedToggle<WorkspaceViewMode>
                value={viewMode}
                onChange={handleViewModeChange}
                options={availableWorkspaceViewOptions}
                size="md"
                ariaLabel="Workspace mode"
              />
            </div>
          </div>
        )}

        <div
          className={css`
            flex: 1;
            overflow: hidden;
            background: #fff;
            min-height: 0;
          `}
        >
          {runtimeOnly ? (
            shouldShowRuntimePreviewStage ? (
              <div className={previewStageClass}>
                {(!shouldMountRuntimePreviewFrame ||
                  !previewFrameReady.primary) && (
                  <div className={previewPreloadSurfaceClass}>
                    <div className={previewPreloadIconWrapClass}>
                      <Icon icon="spinner" className={previewSpinnerClass} />
                    </div>
                    <div className={previewPreloadLabelClass}>Loading...</div>
                  </div>
                )}
                {shouldMountRuntimePreviewFrame && runtimePreviewFrameSrc ? (
                  <iframe
                    key={runtimePreviewFrameNonce || 'primary'}
                    ref={primaryIframeRef}
                    src={runtimePreviewFrameSrc}
                    title="App preview"
                    name={buildPreviewFrameWindowName(runtimePreviewFrameNonce)}
                    allow={BUILD_APP_IFRAME_ALLOW}
                    allowFullScreen
                    sandbox={getRuntimePreviewIframeSandbox(
                      runtimePreviewFrameSrc
                    )}
                    onLoad={() =>
                      handlePreviewFrameLoad('primary', runtimePreviewFrameSrc)
                    }
                    className={previewIframeClass}
                    style={{
                      opacity: previewFrameReady.primary ? 1 : 0,
                      pointerEvents: previewFrameReady.primary ? 'auto' : 'none'
                    }}
                  />
                ) : null}
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
                  This build has no code yet
                </p>
              </div>
            )
          ) : viewMode === 'preview' ? (
            shouldShowWorkspacePreviewStage ? (
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
                    key={
                      previewFrameMetaRef.current.primary.messageNonce ||
                      previewFrameSources.primary ||
                      'primary'
                    }
                    ref={primaryIframeRef}
                    src={previewFrameSources.primary}
                    title="Preview (primary)"
                    name={buildPreviewFrameWindowName(
                      previewFrameMetaRef.current.primary.messageNonce
                    )}
                    allow={BUILD_APP_IFRAME_ALLOW}
                    allowFullScreen
                    sandbox={PREVIEW_IFRAME_SANDBOX}
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
                    key={
                      previewFrameMetaRef.current.secondary.messageNonce ||
                      previewFrameSources.secondary ||
                      'secondary'
                    }
                    ref={secondaryIframeRef}
                    src={previewFrameSources.secondary}
                    title="Preview (secondary)"
                    name={buildPreviewFrameWindowName(
                      previewFrameMetaRef.current.secondary.messageNonce
                    )}
                    allow={BUILD_APP_IFRAME_ALLOW}
                    allowFullScreen
                    sandbox={PREVIEW_IFRAME_SANDBOX}
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
          ) : viewMode === 'manual' ? (
            <AgentManualPane
              capabilitySnapshot={resolvedCapabilitySnapshot}
            />
          ) : (
            <CodeWorkspacePane
              displayedProjectFiles={displayedProjectFiles}
              projectExplorerEntries={projectExplorerEntries}
              selectedFolderPath={selectedFolderPath}
              folderMoveTargetPath={folderMoveTargetPath}
              newFilePath={newFilePath}
              activeFilePath={activeFilePath}
              activeFile={activeFile}
              renamePathInput={renamePathInput}
              isOwner={isOwner}
              isShowingStreamingCode={isShowingStreamingCode}
              hasUnsavedProjectFileChanges={hasUnsavedProjectFileChanges}
              savingProjectFiles={savingProjectFiles}
              downloadingProjectArchive={downloadingProjectArchive}
              projectFilesLocked={projectFilesLocked}
              projectFileError={projectFileError}
              currentBuildRuntimeAssets={workspaceRuntimeAssets}
              streamingAutoFollowEnabled={streamingAutoFollowEnabledRef.current}
              persistedFileContentByPath={persistedFileContentByPath}
              onNewFilePathChange={setNewFilePath}
              onAddProjectFile={handleAddProjectFile}
              onOpenProjectFileUploadPicker={openProjectFileUploadPicker}
              onOpenProjectFolderImportPicker={openProjectFolderImportPicker}
              onOpenProjectAssetUploadPicker={openProjectAssetUploadPicker}
              onOpenRuntimeUploadsManager={() => {
                onOpenRuntimeUploadsManager?.();
              }}
              onFolderMoveTargetPathChange={setFolderMoveTargetPath}
              onMoveSelectedFolder={handleMoveSelectedFolder}
              onSelectFolder={handleSelectFolder}
              onToggleFolderCollapsed={toggleFolderCollapsed}
              onSelectFile={(path) => {
                if (isShowingStreamingCode) {
                  streamingAutoFollowEnabledRef.current = false;
                }
                setActiveFilePath(path);
                setSelectedFolderPath(null);
                setProjectFileError('');
              }}
              onDeleteProjectFile={handleDeleteProjectFile}
              onRenamePathInputChange={setRenamePathInput}
              onRenameOrMoveActiveFile={handleRenameOrMoveActiveFile}
              onSaveEditableProjectFiles={handleSaveEditableProjectFiles}
              onDownloadProjectArchive={handleDownloadProjectArchive}
              onDismissProjectFileError={() => {
                setProjectFileError('');
              }}
              onActiveFileContentChange={handleEditableFileContentChange}
            />
          )}
        </div>
        <GuestRestrictionBanner
          visible={guestRestrictionBannerVisible}
          userId={resolvedUserId}
          message={GUEST_RESTRICTION_BANNER_TEXT}
          onOpenSigninModal={onOpenSigninModal}
          onDismiss={() => setGuestRestrictionBannerVisible(false)}
        />
        {!runtimeOnly && (
          <VersionHistoryModal
            isOpen={historyOpen}
            loadingVersions={loadingVersions}
            versions={versions}
            restoringVersionId={restoringVersionId}
            onClose={() => setHistoryOpen(false)}
            onRestoreVersion={handleRestoreVersion}
          />
        )}
      </div>
    );
  }
);

PreviewPanel.displayName = 'PreviewPanel';

export default PreviewPanel;
