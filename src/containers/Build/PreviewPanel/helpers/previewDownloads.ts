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

function getPreviewDownloadFetchUrl(parsedUrl: URL) {
  if (PREVIEW_DOWNLOAD_PROXY_HOSTS.has(parsedUrl.hostname)) {
    return `${API_URL}/content/image/proxy?url=${encodeURIComponent(
      parsedUrl.href
    )}`;
  }
  return parsedUrl.href;
}

async function createBlobFromPreviewDownloadUrl(
  parsedUrl: URL,
  fallbackMimeType: string
) {
  const fetchUrl = getPreviewDownloadFetchUrl(parsedUrl);
  let response: Response;
  try {
    response = await fetch(fetchUrl, { credentials: 'omit' });
  } catch {
    throw new Error(
      'Could not fetch download URL. The remote server may block browser downloads.'
    );
  }

  if (!response.ok) {
    throw new Error(`Could not fetch download URL (${response.status}).`);
  }

  const blob = await response.blob();
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
