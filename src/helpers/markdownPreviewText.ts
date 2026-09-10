import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { prepareMarkdownText } from '~/components/Texts/RichText/Markdown/helpers';
import { stripTwinkleTextMarkers } from '~/helpers/richTextMarkerHelpers';

interface MarkdownNode {
  children?: MarkdownNode[];
  type?: string;
  value?: unknown;
}

const markdownParser = unified().use(remarkParse).use(remarkGfm);
const blockContainerTypes = new Set([
  'root',
  'blockquote',
  'list',
  'listItem',
  'table',
  'tableRow',
  'tableCell'
]);
// Nodes with no sensible plain-text form: an embed/image is dropped outright
// rather than leaking its `![](url)` source into a one-line preview.
const hiddenNodeTypes = new Set([
  'definition',
  'footnoteDefinition',
  'html',
  'image',
  'imageReference',
  'yaml'
]);

// Plain-text preview of human-authored rich content (subject/video/mission
// descriptions in compact cards). Mirrors what RichText's Markdown pipeline
// recognizes: Twinkle size/color markers and Markdown syntax are removed,
// `[label](url)` keeps its label, `![](url)` embeds vanish, and whitespace
// collapses so the card's CSS line clamp sees one continuous line of prose.
// Literal punctuation the renderer does not treat as Markdown is preserved.
export function getMarkdownPreviewPlainText(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';

  const source = stripTwinkleTextMarkers(value);
  try {
    const tree = markdownParser.parse(
      prepareMarkdownText(source, { isAIMessage: false })
    ) as MarkdownNode;
    return collapsePreviewWhitespace(getMarkdownNodeText(tree));
  } catch {
    // Never destroy user-authored text because the parser rejected unusual
    // input; the full content stays the canonical rich-text surface.
    return collapsePreviewWhitespace(source);
  }
}

function getMarkdownNodeText(node: MarkdownNode): string {
  const type = String(node?.type || '');
  if (hiddenNodeTypes.has(type)) return '';

  if (type === 'text' || type === 'code' || type === 'inlineCode') {
    return typeof node.value === 'string' ? node.value : '';
  }

  if (type === 'break' || type === 'thematicBreak') return ' ';
  if (!Array.isArray(node.children)) return '';

  const separator = blockContainerTypes.has(type) ? ' ' : '';
  return node.children.map(getMarkdownNodeText).filter(Boolean).join(separator);
}

function collapsePreviewWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}
