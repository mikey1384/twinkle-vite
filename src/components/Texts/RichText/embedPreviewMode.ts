export type RichTextEmbedPreviewMode =
  'compactComment' | 'fullWidth' | 'thumbnail';

export function getRichTextEmbedPreviewMode({
  compactEmbedPreview,
  isPreview
}: {
  compactEmbedPreview?: boolean;
  isPreview?: boolean;
}): RichTextEmbedPreviewMode | undefined {
  if (compactEmbedPreview || isPreview) return 'compactComment';
  return undefined;
}
