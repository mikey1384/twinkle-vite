export function swapAttachmentWithNeighbor<T extends { id: string }>(
  attachments: T[],
  attachmentId: string,
  direction: 'left' | 'right'
): T[] {
  const index = attachments.findIndex(
    (attachment) => attachment.id === attachmentId
  );
  const targetIndex = direction === 'left' ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= attachments.length) {
    return attachments;
  }
  const next = [...attachments];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}
