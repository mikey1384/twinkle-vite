import { cloudFrontURL } from '~/constants/defaultValues';

const TOP_LEVEL_ATTACHMENT_PREFIXES = ['edited-image/', 'ai-generated/'];

function normalizeAttachmentPath(filePath: string): string {
  return (filePath || '').replace(/^\/+/, '');
}

function normalizeContentType(contentType: string): string {
  return ['subject', 'comment'].includes(contentType) ? 'feed' : contentType;
}

export function isTopLevelAttachmentPath(filePath: string): boolean {
  const normalizedPath = normalizeAttachmentPath(filePath);
  return TOP_LEVEL_ATTACHMENT_PREFIXES.some((prefix) =>
    normalizedPath.startsWith(prefix)
  );
}

export function buildAttachmentUrl({
  filePath,
  fileName,
  contentType,
  baseUrl = cloudFrontURL
}: {
  filePath?: string;
  fileName?: string;
  contentType: string;
  baseUrl?: string;
}): string {
  if (!filePath) return '';
  const normalizedPath = normalizeAttachmentPath(filePath);
  const encodedFileName = encodeURIComponent(fileName || '');
  if (isTopLevelAttachmentPath(normalizedPath)) {
    return `${baseUrl}/attachments/${normalizedPath}/${encodedFileName}`;
  }
  const normalizedContentType = normalizeContentType(contentType);
  return `${baseUrl}/attachments/${normalizedContentType}/${normalizedPath}/${encodedFileName}`;
}
