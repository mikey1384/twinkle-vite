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

export function shouldKeepRichTextContentVisible({
  isParsed,
  preserveStreamingTextUntilParsed,
  renderAsLiteralText
}: {
  isParsed: boolean;
  preserveStreamingTextUntilParsed: boolean;
  renderAsLiteralText: boolean;
}) {
  return Boolean(
    isParsed || renderAsLiteralText || preserveStreamingTextUntilParsed
  );
}
