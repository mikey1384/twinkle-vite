// Compact Markdown headings scale with the preview's own prose size.
// Callers scope this to their text roots, excluding embedded UI where needed.
export function compactMarkdownPreviewStyles(
  rootSelector: string,
  excludedContent = ''
) {
  return `
  ${rootSelector} :is(h1, h2, h3, h4, h5, h6)${excludedContent} {
    display: block;
    overflow: visible;
    -webkit-line-clamp: unset;
    text-overflow: clip;
    padding: 0;
    margin: 0.8em 0 0.4em;
    color: inherit;
    font-size: 1em;
    font-weight: 700;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }
  ${rootSelector} h1${excludedContent} { font-size: 1.25em; }
  ${rootSelector} h2${excludedContent} { font-size: 1.15em; }
  ${rootSelector} h3${excludedContent} { font-size: 1.05em; }
  ${rootSelector} > :is(h1, h2, h3, h4, h5, h6):first-child {
    margin-top: 0;
  }
  ${rootSelector} p${excludedContent} {
    font-size: inherit;
    line-height: inherit;
  }
  ${rootSelector} :is(h1, h2, h3, h4, h5, h6) + :is(p, ul, ol, blockquote)${excludedContent} {
    margin-top: 0;
  }
  /* RichText preserves the Markdown separator after a heading as a leading
     break in the next paragraph. The heading margin supplies that spacing. */
  ${rootSelector} :is(h1, h2, h3, h4, h5, h6) + p${excludedContent} > br:first-child {
    display: none;
  }
  ${rootSelector} p + p${excludedContent} { margin-top: 0.65em; }
`;
}
