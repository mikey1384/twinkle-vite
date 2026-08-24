import type { PreviewRuntimeUploadAsset } from '../types/runtimeUploadTypes';

export type BuildAgentAssetBytesInput =
  ArrayBuffer | ArrayBufferView | number[];

export interface BuildAgentAssetCreateOptions {
  fileName?: string;
  name?: string;
  mimeType?: string;
  type?: string;
  base64?: string;
  dataUrl?: string;
  bytes?: BuildAgentAssetBytesInput;
  blob?: Blob;
  file?: File;
  text?: string;
  json?: unknown;
}

export interface BuildAgentAssetCreateResult {
  success: true;
  asset: PreviewRuntimeUploadAsset;
  url: string;
  stableUrl: string;
  reference: string;
}

export interface BuildAgentAssetCreateManyResult {
  success: boolean;
  assets: PreviewRuntimeUploadAsset[];
  failed: Array<{ fileName: string; message?: string }>;
}

export interface BuildAgentAssetListOptions {
  cursor?: number | null;
  limit?: number | null;
}

export interface BuildAgentWorkspaceAssetsApi {
  create: (
    options: BuildAgentAssetCreateOptions
  ) => Promise<BuildAgentAssetCreateResult>;
  createMany: (
    items: BuildAgentAssetCreateOptions[]
  ) => Promise<BuildAgentAssetCreateManyResult>;
  list: (options?: BuildAgentAssetListOptions) => Promise<{
    assets: PreviewRuntimeUploadAsset[];
    nextCursor: number | null;
    usage: unknown;
  }>;
  delete: (assetId: number) => Promise<{ success: boolean }>;
  openManager: () => void;
}

export const BUILD_PROJECT_ASSET_UPLOAD_ACCEPT =
  'image/*,audio/*,audio/midi,audio/x-midi,model/gltf-binary,model/gltf+json,.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.tiff,.tif,.heic,.heif,.avif,.mp3,.mid,.midi,.wav,.ogg,.m4a,.aac,.flac,.aif,.aiff,.glb,.gltf,.ktx2,.hdr,.exr,.bin,.drc';

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
  '.mid',
  '.midi',
  '.wav',
  '.ogg',
  '.m4a',
  '.aac',
  '.flac',
  '.aif',
  '.aiff',
  '.glb',
  '.gltf',
  '.ktx2',
  '.hdr',
  '.exr',
  '.bin',
  '.drc'
] as const;

const AGENT_ASSET_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/bmp': '.bmp',
  'image/tiff': '.tiff',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'image/avif': '.avif',
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/midi': '.mid',
  'audio/x-midi': '.mid',
  'audio/wav': '.wav',
  'audio/wave': '.wav',
  'audio/x-wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
  'audio/m4a': '.m4a',
  'audio/aac': '.aac',
  'audio/flac': '.flac',
  'audio/aiff': '.aiff',
  'audio/x-aiff': '.aiff',
  'model/gltf-binary': '.glb',
  'model/gltf+json': '.gltf',
  'image/ktx2': '.ktx2',
  'image/vnd.radiance': '.hdr',
  'image/x-exr': '.exr',
  'application/octet-stream': '.bin'
};

const BUILD_PROJECT_ASSET_UPLOAD_MIME_TYPES = new Set([
  'model/gltf-binary',
  'model/gltf+json'
]);

const GLTF_RELATIVE_URI_UPLOAD_ERROR =
  'Raw .gltf files with relative buffer or texture URIs will not load after upload because companion files get separate asset URLs. Use .glb, embed data URIs, or rewrite .gltf URIs to absolute uploaded asset URLs before uploading.';

export function isSupportedBuildAssetUploadFile(file: File) {
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
    normalizedType.startsWith('image/') ||
    normalizedType.startsWith('audio/') ||
    BUILD_PROJECT_ASSET_UPLOAD_MIME_TYPES.has(normalizedType)
  );
}

function isGltfJsonAssetFile(file: File) {
  const lowerName = String(file?.name || '').toLowerCase();
  const normalizedType = String(file?.type || '').toLowerCase();
  return lowerName.endsWith('.gltf') || normalizedType === 'model/gltf+json';
}

function isExternalOrEmbeddedGltfUri(uri: string) {
  const normalizedUri = String(uri || '').trim();
  if (!normalizedUri) return true;
  if (normalizedUri.startsWith('/') || normalizedUri.startsWith('//')) {
    return true;
  }
  const schemeMatch = normalizedUri.match(/^([A-Za-z][A-Za-z0-9+.-]*):/);
  if (!schemeMatch) return false;
  return ['http', 'https', 'data'].includes(schemeMatch[1].toLowerCase());
}

function collectRelativeGltfUris(parsedGltf: unknown) {
  const relativeUris: string[] = [];
  if (!parsedGltf || typeof parsedGltf !== 'object') {
    return relativeUris;
  }
  const gltf = parsedGltf as {
    buffers?: Array<{ uri?: unknown }>;
    images?: Array<{ uri?: unknown }>;
  };
  const buffers = Array.isArray(gltf.buffers) ? gltf.buffers : [];
  const images = Array.isArray(gltf.images) ? gltf.images : [];
  for (const entry of [...buffers, ...images]) {
    const uri = typeof entry?.uri === 'string' ? entry.uri.trim() : '';
    if (uri && !isExternalOrEmbeddedGltfUri(uri)) {
      relativeUris.push(uri);
    }
  }
  return relativeUris;
}

export async function getBuildAssetUploadValidationError(file: File) {
  if (!isSupportedBuildAssetUploadFile(file)) {
    return 'Project assets support images, audio, GLB/self-contained glTF models, KTX2, HDR, EXR, BIN, and DRC files.';
  }
  if (!isGltfJsonAssetFile(file)) {
    return null;
  }
  let parsedGltf: unknown;
  try {
    parsedGltf = JSON.parse(await file.text());
  } catch {
    return '.gltf assets must contain valid JSON.';
  }
  const relativeUris = collectRelativeGltfUris(parsedGltf);
  if (relativeUris.length === 0) {
    return null;
  }
  const sampleUris = relativeUris
    .slice(0, 3)
    .map((uri) => `"${uri}"`)
    .join(', ');
  return `${GLTF_RELATIVE_URI_UPLOAD_ERROR} Relative URI${
    relativeUris.length === 1 ? '' : 's'
  }: ${sampleUris}${relativeUris.length > 3 ? ', ...' : ''}`;
}

export function normalizeBuildAgentAssetLimit(
  limit: number | null | undefined
) {
  const normalizedLimit = Math.floor(Number(limit));
  if (!Number.isFinite(normalizedLimit) || normalizedLimit <= 0) {
    return 30;
  }
  return Math.min(normalizedLimit, 100);
}

function getAgentAssetDataUrlMimeType(dataUrl: string) {
  const match = String(dataUrl || '').match(/^data:([^;,]+)(?:;[^,]*)?,/i);
  return match?.[1]?.trim() || '';
}

function resolveAgentAssetMimeType(
  options: BuildAgentAssetCreateOptions,
  fallbackMimeType = ''
) {
  return String(
    options.mimeType || options.type || fallbackMimeType || ''
  ).trim();
}

function resolveAgentAssetFileName({
  options,
  mimeType
}: {
  options: BuildAgentAssetCreateOptions;
  mimeType: string;
}) {
  const requestedName = String(options.fileName || options.name || '').trim();
  if (requestedName) return requestedName;
  const normalizedMimeType = mimeType.toLowerCase();
  const extension =
    AGENT_ASSET_EXTENSION_BY_MIME_TYPE[normalizedMimeType] || '';
  return `asset-${Date.now()}${extension}`;
}

function decodeAgentAssetBase64(rawBase64: string) {
  const trimmedBase64 = String(rawBase64 || '')
    .replace(/^data:[^,]+,/i, '')
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const paddedBase64 =
    trimmedBase64.length % 4 === 0
      ? trimmedBase64
      : trimmedBase64.padEnd(
          trimmedBase64.length + (4 - (trimmedBase64.length % 4)),
          '='
        );
  const binary = window.atob(paddedBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function normalizeAgentAssetBytesInput(bytes: BuildAgentAssetBytesInput) {
  if (bytes instanceof ArrayBuffer) {
    return new Uint8Array(bytes);
  }
  if (ArrayBuffer.isView(bytes)) {
    return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }
  if (Array.isArray(bytes)) {
    return new Uint8Array(bytes);
  }
  throw new Error(
    'Asset bytes must be an ArrayBuffer, typed array, or number array.'
  );
}

function copyAgentAssetBytesToArrayBuffer(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export async function createAgentAssetFile(
  options: BuildAgentAssetCreateOptions
) {
  const fallbackMimeType = options.dataUrl
    ? getAgentAssetDataUrlMimeType(options.dataUrl)
    : /^data:/i.test(String(options.base64 || ''))
      ? getAgentAssetDataUrlMimeType(String(options.base64 || ''))
      : options.file instanceof File
        ? options.file.type
        : options.blob instanceof Blob
          ? options.blob.type
          : '';
  const mimeType = resolveAgentAssetMimeType(options, fallbackMimeType);
  const fileName = resolveAgentAssetFileName({ options, mimeType });

  if (options.file instanceof File) {
    if (
      !options.fileName &&
      !options.name &&
      (!mimeType || mimeType === options.file.type)
    ) {
      return options.file;
    }
    return new File([options.file], fileName, {
      type: mimeType || options.file.type || 'application/octet-stream'
    });
  }

  if (options.blob instanceof Blob) {
    return new File([options.blob], fileName, {
      type: mimeType || options.blob.type || 'application/octet-stream'
    });
  }

  if (options.dataUrl) {
    const response = await fetch(options.dataUrl);
    if (!response.ok) {
      throw new Error('Failed to read asset data URL.');
    }
    const blob = await response.blob();
    return new File([blob], fileName, {
      type: mimeType || blob.type || 'application/octet-stream'
    });
  }

  if (options.base64) {
    const bytes = decodeAgentAssetBase64(options.base64);
    return new File([copyAgentAssetBytesToArrayBuffer(bytes)], fileName, {
      type: mimeType || 'application/octet-stream'
    });
  }

  if (options.bytes) {
    const bytes = normalizeAgentAssetBytesInput(options.bytes);
    return new File([copyAgentAssetBytesToArrayBuffer(bytes)], fileName, {
      type: mimeType || 'application/octet-stream'
    });
  }

  if (typeof options.text === 'string') {
    return new File([options.text], fileName, {
      type: mimeType || 'text/plain'
    });
  }

  if (Object.prototype.hasOwnProperty.call(options, 'json')) {
    return new File([JSON.stringify(options.json, null, 2)], fileName, {
      type: mimeType || 'application/json'
    });
  }

  throw new Error(
    'Provide asset content with file, blob, dataUrl, base64, bytes, text, or json.'
  );
}
