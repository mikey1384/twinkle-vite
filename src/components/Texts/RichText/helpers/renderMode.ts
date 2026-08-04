export function shouldRenderRichTextLiterally({
  cleanString,
  isStreaming,
  tooLongNonUrlToken
}: {
  cleanString?: boolean;
  isStreaming?: boolean;
  tooLongNonUrlToken?: boolean;
}) {
  return Boolean(cleanString || isStreaming || tooLongNonUrlToken);
}
