export type RichTextEmbedPreviewMode =
  'compactComment' | 'fullWidth' | 'thumbnail';
export type RichTextSubjectPreviewVariant = 'fullWidth' | 'thumbnail';

const fullWidthSubjectEmbedReservedHeight = '19rem';

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

export function getRichTextSubjectPreviewVariant({
  compactEmbedPreview,
  subjectPreviewVariant
}: {
  compactEmbedPreview?: boolean;
  subjectPreviewVariant?: RichTextSubjectPreviewVariant;
}) {
  return compactEmbedPreview ? undefined : subjectPreviewVariant;
}

export function getRichTextPreviewMaxHeight({
  hasMarkdownEmbed,
  lineHeight,
  maxLines,
  subjectPreviewVariant
}: {
  hasMarkdownEmbed: boolean;
  lineHeight: number;
  maxLines: number;
  subjectPreviewVariant?: RichTextSubjectPreviewVariant;
}) {
  const reservedHeight =
    hasMarkdownEmbed && subjectPreviewVariant === 'fullWidth'
      ? ` + ${fullWidthSubjectEmbedReservedHeight}`
      : '';
  return `calc(${lineHeight}em * ${maxLines}${reservedHeight})`;
}
