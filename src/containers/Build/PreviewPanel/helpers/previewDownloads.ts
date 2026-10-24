import API_URL from '~/constants/URL';

const PREVIEW_DOWNLOAD_PROXY_HOSTS = new Set([
  'd3jvoamd2k4p0s.cloudfront.net',
  'twinkle-network.s3.amazonaws.com'
]);

function normalizePreviewDownloadFileName(rawFileName: unknown) {
  let fileName = String(rawFileName || '').trim();
  if (!fileName) fileName = 'download.txt';
  fileName = fileName
    .replace(/[\u0000-\u001f\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  if (!fileName || fileName === '.' || fileName === '..') {
    fileName = 'download.txt';
  }
  return fileName.slice(0, 180);
}

function isPreviewDownloadBlob(value: any): value is Blob {
  return (
    value instanceof Blob ||
    (value &&
      typeof value === 'object' &&
      typeof value.arrayBuffer === 'function' &&
      typeof value.slice === 'function' &&
      Number.isFinite(Number(value.size)))
  );
}

function isPreviewDownloadArrayBuffer(value: any): value is ArrayBuffer {
  return typeof ArrayBuffer === 'function' && value instanceof ArrayBuffer;
}

function isPreviewDownloadTypedArray(value: any) {
  return (
    typeof ArrayBuffer !== 'undefined' &&
    ArrayBuffer.isView &&
    ArrayBuffer.isView(value)
  );
}

function createBlobFromPreviewDownloadDataUrl(
  dataUrl: string,
  fallbackMimeType: string
) {
  const match = String(dataUrl || '').match(
    /^data:([^;,]+)(?:;[^,]*)?;base64,(.*)$/i
  );
  if (!match) {
    throw new Error('Invalid data URL for download.');
  }
  const binary = atob(String(match[2] || '').replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], {
    type: match[1] || fallbackMimeType || 'application/octet-stream'
  });
}

function createBlobFromPreviewDownloadPayload(payload: any) {
  const mimeType = String(payload?.mimeType || payload?.type || '').trim();
  let value: any;

  if (typeof payload?.dataUrl === 'string') {
    return createBlobFromPreviewDownloadDataUrl(payload.dataUrl, mimeType);
  }
  if (isPreviewDownloadBlob(payload?.blob)) {
    const blob = payload.blob;
    return mimeType && blob.type !== mimeType
      ? blob.slice(0, blob.size, mimeType)
      : blob;
  }
  if (isPreviewDownloadBlob(payload?.file)) {
    const blob = payload.file;
    return mimeType && blob.type !== mimeType
      ? blob.slice(0, blob.size, mimeType)
      : blob;
  }
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'bytes')) {
    value = payload.bytes;
  } else if (payload && Object.prototype.hasOwnProperty.call(payload, 'text')) {
    value = payload.text == null ? '' : String(payload.text);
  } else if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    value = payload.data;
  }

  if (value === undefined) {
    throw new Error(
      'Twinkle.files.saveAs requires url, dataUrl, data, text, json, bytes, blob, or file'
    );
  }

  const resolvedMimeType =
    mimeType ||
    (typeof value === 'string'
      ? 'text/plain;charset=utf-8'
      : 'application/octet-stream');

  if (isPreviewDownloadArrayBuffer(value) || isPreviewDownloadTypedArray(value)) {
    return new Blob([value], { type: resolvedMimeType });
  }
  if (typeof value === 'string' && value.indexOf('data:') === 0) {
    return createBlobFromPreviewDownloadDataUrl(value, resolvedMimeType);
  }
  if (typeof value === 'string') {
    return new Blob([value], { type: resolvedMimeType });
  }
  const serializedValue = JSON.stringify(value, null, 2);
  return new Blob([serializedValue ?? String(value)], {
    type: resolvedMimeType
  });
}

function triggerPreviewObjectUrlDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  return {
    success: true,
    fileName,
    size: blob.size,
    mimeType: blob.type || '',
    method: 'object-url-anchor'
  };
}

function getPreviewDownloadProxyUrl(parsedUrl: URL) {
  return `${API_URL}/content/image/proxy?url=${encodeURIComponent(
    parsedUrl.href
  )}`;
}

// Saving a file needs no tap, so an app could ask for any size: stop at
// 500 MB, checked against the declared length and again while reading.
const PREVIEW_DOWNLOAD_MAX_BYTES = 500 * 1024 * 1024;

function previewDownloadTooLargeError(bytes: number) {
  return new Error(
    `This file is too large to download here (${Math.ceil(
      bytes / (1024 * 1024)
    )} MB; the limit is ${PREVIEW_DOWNLOAD_MAX_BYTES / (1024 * 1024)} MB).`
  );
}

// A response that declares its size within the limit is read with
// response.blob(), which lets the browser keep a large file on disk; only a
// response with no declared size is streamed and counted here, since that
// is the one case the limit could not be checked up front (holding the
// chunks costs about twice the file in memory, so it is not the default).
async function readPreviewDownloadBody(response: Response) {
  const rawLength = response.headers?.get?.('content-length');
  const declared =
    rawLength != null && String(rawLength).trim() !== ''
      ? Number(rawLength)
      : NaN;
  if (Number.isFinite(declared) && declared >= 0) {
    if (declared > PREVIEW_DOWNLOAD_MAX_BYTES) {
      // Stop the browser fetching the rest in the background.
      await response.body?.cancel?.().catch(() => {});
      throw previewDownloadTooLargeError(declared);
    }
    return readPreviewDownloadBlob(response);
  }
  const reader = response.body?.getReader?.();
  if (!reader) return readPreviewDownloadBlob(response);
  const chunks: BlobPart[] = [];
  let total = 0;
  for (;;) {
    let next: ReadableStreamReadResult<Uint8Array>;
    try {
      next = await reader.read();
    } catch {
      await reader.cancel().catch(() => {});
      throw new Error('The download was interrupted. Please try again.');
    }
    if (next.done) break;
    total += next.value.byteLength;
    if (total > PREVIEW_DOWNLOAD_MAX_BYTES) {
      await reader.cancel().catch(() => {});
      throw previewDownloadTooLargeError(total);
    }
    chunks.push(next.value as BlobPart);
  }
  // The MIME type as response.blob() would report it (lower case, trimmed).
  const type = String(response.headers?.get?.('content-type') || '')
    .trim()
    .toLowerCase();
  return new Blob(chunks, { type });
}

// A declared size can be the compressed one, so the decoded file is checked
// again after reading.
async function readPreviewDownloadBlob(response: Response) {
  const blob = await response.blob();
  if (blob.size > PREVIEW_DOWNLOAD_MAX_BYTES) {
    throw previewDownloadTooLargeError(blob.size);
  }
  return blob;
}

// networkFailure marks a fetch that never got a response (blocked, offline,
// refused by CORS), the only case worth retrying through the proxy: a 403 or
// 404 from Twinkle's file host would be the same through it.
async function fetchPreviewDownloadBlob(fetchUrl: string) {
  let response: Response;
  try {
    response = await fetch(fetchUrl, { credentials: 'omit' });
  } catch {
    throw Object.assign(
      new Error(
        'Could not fetch download URL. The remote server may block browser downloads.'
      ),
      { networkFailure: true }
    );
  }
  if (!response.ok) {
    throw new Error(`Could not fetch download URL (${response.status}).`);
  }
  return readPreviewDownloadBody(response);
}

// Twinkle's file host serves files to any origin (CORS *), so the file is
// fetched directly first: the proxy only passes images (415 for audio, PDFs
// and other files) and caps them at 5 MB, which broke saveAs({ url }) for a
// Groove Lab mp3 or a Book Maker PDF (10-24). The proxy stays as a fallback
// for Twinkle-hosted files the direct fetch cannot reach at all.
async function createBlobFromPreviewDownloadUrl(
  parsedUrl: URL,
  fallbackMimeType: string
) {
  let blob: Blob;
  try {
    blob = await fetchPreviewDownloadBlob(parsedUrl.href);
  } catch (directError: any) {
    if (
      !directError?.networkFailure ||
      !PREVIEW_DOWNLOAD_PROXY_HOSTS.has(parsedUrl.hostname)
    ) {
      throw directError;
    }
    blob = await fetchPreviewDownloadBlob(getPreviewDownloadProxyUrl(parsedUrl));
  }
  return fallbackMimeType && blob.type !== fallbackMimeType
    ? blob.slice(0, blob.size, fallbackMimeType)
    : blob;
}

async function triggerPreviewUrlDownload(
  url: string,
  fileName: string,
  mimeType: string
) {
  const parsedUrl = new URL(String(url || '').trim(), window.location.href);
  if (!/^https?:$/i.test(parsedUrl.protocol)) {
    throw new Error('Invalid URL for download.');
  }

  if (parsedUrl.origin === window.location.origin) {
    const link = document.createElement('a');
    link.href = parsedUrl.href;
    link.download = fileName;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return {
      success: true,
      fileName,
      mimeType: '',
      method: 'same-origin-anchor'
    };
  }

  const blob = await createBlobFromPreviewDownloadUrl(parsedUrl, mimeType);
  return triggerPreviewObjectUrlDownload(blob, fileName);
}

export async function triggerPreviewLocalDownload(payload: any) {
  const fileName = normalizePreviewDownloadFileName(
    payload?.fileName || payload?.name || payload?.file?.name || 'download'
  );

  if (typeof payload?.url === 'string' && payload.url.trim()) {
    const mimeType = String(payload?.mimeType || payload?.type || '').trim();
    return triggerPreviewUrlDownload(payload.url, fileName, mimeType);
  }

  const blob = createBlobFromPreviewDownloadPayload(payload);
  return triggerPreviewObjectUrlDownload(blob, fileName);
}
