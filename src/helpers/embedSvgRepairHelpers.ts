import API_URL from '~/constants/URL';

export function getEmbedSvgRepairImageUrl(src: string) {
  const normalizedSrc = String(src || '').trim();
  if (!isRepairableEmbedSvgUrl(normalizedSrc)) return '';
  return `${API_URL}/content/embed/svg-repair?url=${encodeURIComponent(
    normalizedSrc
  )}`;
}

function isRepairableEmbedSvgUrl(src: string) {
  if (!src) return false;

  try {
    const url = new URL(src);
    return isEmbedAttachmentSvgPath(url.pathname);
  } catch {
    return isEmbedAttachmentSvgPath(src);
  }
}

function isEmbedAttachmentSvgPath(value: string) {
  const path = String(value || '').split('?')[0].split('#')[0].toLowerCase();
  return (
    (path.includes('/attachments/embed/') ||
      path.startsWith('attachments/embed/')) &&
    path.endsWith('.svg')
  );
}
