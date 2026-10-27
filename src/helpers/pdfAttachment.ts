const PDF_MAX_BYTES = 50 * 1024 * 1024;
const FILE_HOSTS = new Set([
  'd3jvoamd2k4p0s.cloudfront.net',
  'twinkle-network.s3.amazonaws.com'
]);

// Only intercept our attachments. Ordinary external links keep their native
// navigation instead of causing a cross-origin fetch when someone taps them.
export function getPdfAttachmentName(src: string): string | null {
  try {
    const url = new URL(src);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      !FILE_HOSTS.has(url.host) ||
      !url.pathname.startsWith('/attachments/')
    )
      return null;
    const name = decodeURIComponent(url.pathname.split('/').pop() || '');
    return /\.pdf$/i.test(name) ? name : null;
  } catch {
    return null;
  }
}

export async function loadPdfAttachment(
  src: string,
  fileName: string,
  signal: AbortSignal
): Promise<File> {
  if (!getPdfAttachmentName(src))
    throw new Error('This PDF cannot be previewed here.');
  const response = await fetch(src, { signal, credentials: 'omit' });
  if (!response.ok)
    throw new Error('Could not load this PDF. Please try again.');
  const tooLarge = () =>
    new Error(
      'This PDF is too large to preview here. You can still open or download it.'
    );
  if (Number(response.headers.get('content-length')) > PDF_MAX_BYTES) {
    await response.body?.cancel();
    throw tooLarge();
  }
  const reader = response.body?.getReader();
  const parts: BlobPart[] = [];
  let size = 0;
  if (reader) {
    try {
      for (;;) {
        const next = await reader.read();
        if (next.done) break;
        size += next.value.byteLength;
        if (size > PDF_MAX_BYTES) throw tooLarge();
        parts.push(next.value as BlobPart);
      }
    } catch (error) {
      await reader.cancel().catch(() => {});
      throw error;
    } finally {
      reader.releaseLock();
    }
  } else {
    const blob = await response.blob();
    if (blob.size > PDF_MAX_BYTES) throw tooLarge();
    parts.push(blob);
  }
  signal.throwIfAborted();
  const file = new File(parts, fileName, { type: 'application/pdf' });
  // Do not turn an HTML error page (or a renamed executable) into a PDF share.
  const header = await file.slice(0, 1024).text();
  if (!header.includes('%PDF-'))
    throw new Error('This attachment is not a readable PDF.');
  signal.throwIfAborted();
  return file;
}

export function canSharePdf(file: File): boolean {
  try {
    return (
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] })
    );
  } catch {
    return false;
  }
}
