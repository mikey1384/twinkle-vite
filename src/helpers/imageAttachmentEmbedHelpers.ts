import { stringIsEmpty } from '~/helpers/stringHelpers';

export const IMAGE_ATTACHMENT_DRAG_MIME_TYPE =
  'application/x-twinkle-image-attachment-id';

const FALLBACK_TEXT_PREFIX = '__twinkle_image_attachment__:';

export function setImageAttachmentDragData(
  dataTransfer: DataTransfer,
  attachmentId: string
) {
  if (!dataTransfer || !attachmentId) return;
  dataTransfer.effectAllowed = 'move';
  dataTransfer.setData(IMAGE_ATTACHMENT_DRAG_MIME_TYPE, attachmentId);
  dataTransfer.setData('text/plain', `${FALLBACK_TEXT_PREFIX}${attachmentId}`);
}

export function getImageAttachmentIdFromDataTransfer(
  dataTransfer?: DataTransfer | null
) {
  if (!dataTransfer) return '';

  const directId = dataTransfer.getData(IMAGE_ATTACHMENT_DRAG_MIME_TYPE);
  if (directId) return directId;

  const fallbackText = dataTransfer.getData('text/plain');
  if (fallbackText?.startsWith(FALLBACK_TEXT_PREFIX)) {
    return fallbackText.slice(FALLBACK_TEXT_PREFIX.length);
  }

  return '';
}

export function appendImageMarkdownToText(text: string, imageUrl: string) {
  return `${stringIsEmpty(text) ? '' : `${text}\n`}![](${imageUrl})`;
}
