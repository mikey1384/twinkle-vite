import type { PreviewRuntimeUploadAsset } from './types';

export type BuildAgentAssetBytesInput =
  | ArrayBuffer
  | ArrayBufferView
  | number[];

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
  list: (
    options?: BuildAgentAssetListOptions
  ) => Promise<{
    assets: PreviewRuntimeUploadAsset[];
    nextCursor: number | null;
    usage: unknown;
  }>;
  delete: (assetId: number) => Promise<{ success: boolean }>;
  openManager: () => void;
}

export const BUILD_PROJECT_ASSET_UPLOAD_ACCEPT =
  'image/*,audio/*,.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.tiff,.tif,.heic,.heif,.avif,.mp3,.wav,.ogg,.m4a,.aac,.flac,.aif,.aiff';

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
  'audio/wav': '.wav',
  'audio/wave': '.wav',
  'audio/x-wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
  'audio/m4a': '.m4a',
  'audio/aac': '.aac',
  'audio/flac': '.flac',
  'audio/aiff': '.aiff',
  'audio/x-aiff': '.aiff'
};

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
    normalizedType.startsWith('image/') || normalizedType.startsWith('audio/')
  );
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
