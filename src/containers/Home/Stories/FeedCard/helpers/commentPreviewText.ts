import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import { prepareMarkdownText } from '~/components/Texts/RichText/Markdown/helpers';
import { stripTwinkleTextMarkers } from '~/helpers/richTextMarkerHelpers';

interface MarkdownNode {
  children?: MarkdownNode[];
  type?: string;
  value?: unknown;
}

const humanMarkdownParser = unified().use(remarkParse).use(remarkGfm);
const aiMarkdownParser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath);
const blockContainerTypes = new Set([
  'root',
  'blockquote',
  'list',
  'listItem',
  'table',
  'tableRow',
  'tableCell'
]);
const hiddenNodeTypes = new Set([
  'definition',
  'footnoteDefinition',
  'html',
  'image',
  'imageReference',
  'yaml'
]);

export function getCommentPreviewPlainText(
  value: unknown,
  { isAIMessage = false }: { isAIMessage?: boolean } = {}
) {
  if (typeof value !== 'string' || !value.trim()) return '';

  const source = stripTwinkleTextMarkers(value);
  try {
    const preparedText = prepareMarkdownText(source, { isAIMessage });
    const parser = isAIMessage ? aiMarkdownParser : humanMarkdownParser;
    const tree = parser.parse(preparedText) as MarkdownNode;
    return collapsePreviewWhitespace(getMarkdownNodeText(tree));
  } catch {
    // A preview must never destroy user-authored punctuation just because the
    // Markdown parser rejected unusual input. The full comment remains the
    // canonical rich-text surface; this fallback keeps its source readable.
    return collapsePreviewWhitespace(source);
  }
}

function getMarkdownNodeText(node: MarkdownNode): string {
  const type = String(node?.type || '');
  if (hiddenNodeTypes.has(type)) return '';

  if (
    type === 'text' ||
    type === 'code' ||
    type === 'inlineCode' ||
    type === 'math' ||
    type === 'inlineMath'
  ) {
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
