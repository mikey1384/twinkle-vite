const INLINE_LABEL_TAGS = new Set([
  'strong',
  'em',
  'span',
  'code',
  'u',
  'i',
  'b',
  'small'
]);
const INLINE_BREAK_TAGS = new Set([
  'a',
  'b',
  'code',
  'em',
  'i',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'u'
]);

export function containsDescendantTagNames(
  node: { children?: any[] },
  tagNames: string[]
): boolean {
  if (!node?.children) {
    return false;
  }
  return node.children.some((child: any) => {
    if (child?.type !== 'tag') {
      return false;
    }
    if (tagNames.includes(child.name)) {
      return true;
    }
    return containsDescendantTagNames(child, tagNames);
  });
}

export function getParentTagName(node?: { parent?: any }) {
  const parent = node?.parent as { name?: string } | undefined;
  return typeof parent?.name === 'string' ? parent.name : undefined;
}

export function stripLeadingBreakNodes(nodes?: any[]) {
  if (!Array.isArray(nodes)) {
    return [];
  }
  let startIndex = 0;
  while (startIndex < nodes.length) {
    const child = nodes[startIndex];
    if (
      (child?.type === 'tag' && child.name === 'br') ||
      (child?.type === 'text' && !child.data?.trim())
    ) {
      startIndex++;
      continue;
    }
    break;
  }
  return nodes.slice(startIndex);
}

export function splitNodesByDoubleBreaks(nodes?: any[]) {
  if (!Array.isArray(nodes) || !nodes.length) {
    return [];
  }
  const segments: any[][] = [];
  let current: any[] = [];
  let i = 0;
  while (i < nodes.length) {
    if (isBreakNode(nodes[i])) {
      const breakNodes: any[] = [];
      while (i < nodes.length && isBreakNode(nodes[i])) {
        breakNodes.push(nodes[i]);
        i++;
      }
      if (breakNodes.length >= 2) {
        if (current.length) {
          segments.push(current);
        }
        current = [];
      } else {
        current.push(...breakNodes);
      }
      continue;
    }
    current.push(nodes[i]);
    i++;
  }
  if (current.length) {
    segments.push(current);
  }
  return segments;
}

export function hasMeaningfulContent(nodes?: any[]) {
  const normalizedNodes = stripLeadingBreakNodes(nodes);
  if (!normalizedNodes.length) {
    return false;
  }
  return normalizedNodes.some((child: any) => {
    if (child?.type === 'text') {
      return !!child.data?.trim();
    }
    if (child?.type === 'tag') {
      if (child.name === 'br') {
        return false;
      }
      return true;
    }
    return false;
  });
}

export function splitLabelAndContent(nodes?: any[]) {
  if (!Array.isArray(nodes) || !nodes.length) {
    return null;
  }
  const normalizedNodes = stripLeadingBreakNodes(nodes);
  const breakIndex = normalizedNodes.findIndex(
    (child: any) => child?.type === 'tag' && child.name === 'br'
  );
  if (breakIndex === -1) {
    return null;
  }
  const labelNodes = normalizedNodes.slice(0, breakIndex);
  const contentNodes = stripLeadingBreakNodes(
    normalizedNodes.slice(breakIndex + 1)
  );
  if (
    !labelNodes.length ||
    !contentNodes.length ||
    !isSectionLabelParagraph(labelNodes) ||
    !hasMeaningfulContent(contentNodes)
  ) {
    return null;
  }
  return { labelNodes, contentNodes };
}

export function isSectionLabelParagraph(nodes?: any[]) {
  if (!Array.isArray(nodes) || !nodes.length) {
    return false;
  }
  const normalizedNodes = stripLeadingBreakNodes(nodes).filter(
    (child: any) => {
      if (child?.type === 'tag' && child.name === 'br') {
        return false;
      }
      if (child?.type === 'text') {
        return !!child.data?.trim();
      }
      return true;
    }
  );
  if (!normalizedNodes.length) {
    return false;
  }
  const allInlineNodes = normalizedNodes.every((child: any) => {
    if (child?.type === 'text') {
      return true;
    }
    if (child?.type === 'tag') {
      if (INLINE_LABEL_TAGS.has(child.name)) {
        return true;
      }
      return false;
    }
    return false;
  });
  if (!allInlineNodes) {
    return false;
  }
  const labelText = normalizedNodes
    .map((child: any) => extractNodeText(child))
    .join('')
    .trim();
  if (!labelText || labelText.length > 160) {
    return false;
  }
  if (!/[:：]$/.test(labelText)) {
    return false;
  }
  const colonCount =
    (labelText.match(/:/g) || []).length +
    (labelText.match(/：/g) || []).length;
  if (colonCount !== 1) {
    return false;
  }
  return true;
}

export function handleMentions(text: string) {
  if (!text) {
    return text;
  }
  // Fullwidth ＠ (U+FF20) indicates invalid/non-existent users.
  // These should display as plain @username text, not links.
  const FAKE_AT_PLACEHOLDER = '\uE000';
  const hasFakeAt = text.includes('＠');
  const baseText = hasFakeAt
    ? text.replace(/＠/g, FAKE_AT_PLACEHOLDER)
    : text;
  const containsAngleBrackets = /[<>]/.test(baseText);
  if (baseText.indexOf('@') === -1 && !containsAngleBrackets) {
    const result = applyLineBreaks(baseText);
    return hasFakeAt ? result.replace(/\uE000/g, '@') : result;
  }
  const mentionTestRegex = /@[A-Za-z0-9_%]{3,}/;
  if (!mentionTestRegex.test(baseText) && !containsAngleBrackets) {
    const result = applyLineBreaks(baseText);
    return hasFakeAt ? result.replace(/\uE000/g, '@') : result;
  }
  const mentionReplaceRegex = /@[A-Za-z0-9_%]{3,}/g;
  const mentionReplacer = (match: string) => {
    const path = match.slice(1);
    return `<a class="mention" href="/users/${path}">@${path}</a>`;
  };
  if (!containsAngleBrackets) {
    let replaced = baseText.replace(mentionReplaceRegex, mentionReplacer);
    if (hasFakeAt) {
      replaced = replaced.replace(/\uE000/g, '@');
    }
    return applyLineBreaks(replaced);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(baseText, 'text/html');

  traverse(doc.body);
  let result = doc.body.innerHTML;
  if (hasFakeAt) {
    result = result.replace(/\uE000/g, '@');
  }
  return applyLineBreaks(result);

  function traverse(node: Node) {
    if (
      node.nodeType === Node.TEXT_NODE &&
      node.parentNode?.nodeName.toLowerCase() !== 'a' &&
      node.parentNode?.nodeName.toLowerCase() !== 'code'
    ) {
      const parent = node.parentNode;
      const nodeValue = node.nodeValue || '';

      let newNodeValue = nodeValue;
      if (nodeValue.includes('<')) {
        newNodeValue = newNodeValue.replace(/</g, '&lt;');
      }
      if (nodeValue.includes('>')) {
        newNodeValue = newNodeValue.replace(/>/g, '&gt;');
      }
      if (mentionTestRegex.test(nodeValue)) {
        newNodeValue = newNodeValue.replace(
          mentionReplaceRegex,
          mentionReplacer
        );
      }

      if (nodeValue !== newNodeValue) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newNodeValue;
        const docFrag = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          const child = tempDiv.firstChild;
          docFrag.appendChild(child);
        }
        parent?.replaceChild(docFrag, node);
      }
    }

    for (const childNode of node.childNodes) {
      traverse(childNode);
    }
  }
}

export function keyToCamelCase(obj: { [key: string]: string } | null) {
  const newObj: Record<string, any> = {};
  for (const key in obj) {
    const camelCaseKey = key.replace(/-([a-z])/g, (_match, p1) =>
      p1.toUpperCase()
    );
    newObj[camelCaseKey] = obj[key];
  }
  return newObj;
}

export function preprocessText(
  text: string,
  { isAIMessage }: { isAIMessage?: boolean }
) {
  // Protection regex for code blocks and math blocks
  // For inline math $...$, we match content that contains at least one "math character"
  // (letter, backslash, caret, underscore, braces, parens, or math operators)
  // This avoids matching currency like $100 while allowing math like $2x$ or $2(a+b)$
  const protectedBlockRegex =
    /```[\s\S]*?```|`[^`\n]*`|\$\$[\s\S]*?\$\$|\$[^$\n]*[a-zA-Z_{}()+*/<>=\\^][^$\n]*\$/g;
  const matches = [...text.matchAll(protectedBlockRegex)];

  if (!matches.length) {
    return preprocessNonCode(text, {
      isAIMessage,
      isAtStart: true,
      isAtEnd: true
    });
  }

  let lastIndex = 0;
  let processedText = '';

  matches.forEach((match) => {
    const beforeCode = text.slice(lastIndex, match.index!);
    if (beforeCode) {
      processedText += preprocessNonCode(beforeCode, {
        isAIMessage,
        isAtStart: lastIndex === 0,
        isAtEnd: false
      });
    }

    processedText += match[0];
    lastIndex = match.index! + match[0].length;
  });

  const tail = text.slice(lastIndex);
  if (tail) {
    processedText += preprocessNonCode(tail, {
      isAIMessage,
      isAtStart: lastIndex === 0,
      isAtEnd: true
    });
  }

  return processedText;
}

export function removeNbsp(
  text: string | undefined,
  { isAIMessage }: { isAIMessage?: boolean }
) {
  if (isAIMessage) return text;
  if (typeof text !== 'string') return text;

  return (text || '').replace(/&(?:amp;)?nbsp;/g, '').replace(/\u00A0/g, '');
}

export function unescapeHtml(text: string) {
  if (typeof text !== 'string') return text;
  if (!(text.includes('&lt;') || text.includes('&gt;'))) return text;
  return (text || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

export function unescapeEqualSignAndDash(text: string) {
  if (typeof text !== 'string') return text;
  if (
    !(
      text.includes('\\=') ||
      text.includes('%5C=') ||
      text.includes('\\-') ||
      text.includes('\\_') ||
      text.includes('%5C-') ||
      text.includes('%5C_') ||
      text.includes('%5F')
    )
  ) {
    return text;
  }

  return (text || '')
    .replace(/%5C/gi, '\\')
    .replace(/\\=/g, '=')
    .replace(/\\-/g, '-')
    .replace(/\\_/g, '_')
    .replace(/%5F/gi, '_');
}

function isBreakNode(node?: any) {
  return node?.type === 'tag' && node.name === 'br';
}

function extractNodeText(node: any): string {
  if (!node) {
    return '';
  }
  if (node.type === 'text') {
    return typeof node.data === 'string' ? node.data : '';
  }
  if (Array.isArray(node.children)) {
    return node.children.map((child: any) => extractNodeText(child)).join('');
  }
  return '';
}

function applyLineBreaks(value: string) {
  if (!value || !value.includes('\n')) {
    return value;
  }
  const lowerValue = value.toLowerCase();
  return value.replace(/\n/g, (_, offset) => {
    // Preserve newlines inside pre, code, and svg tags to avoid corrupting content
    if (isWithinPreservedTag(lowerValue, offset, ['pre', 'code', 'svg'])) {
      return '\n';
    }
    const prev = findPreviousNonWhitespace(value, offset - 1);
    const next = findNextNonWhitespace(value, offset + 1);
    const isBetweenTags = prev === '>' && next === '<';
    if (isBetweenTags) {
      return shouldPreserveBetweenInlineTags(value, offset) ? '<br />' : '';
    }
    return '<br />';
  });
}

function shouldPreserveBetweenInlineTags(html: string, newlineIndex: number) {
  const prevTagName = getPreviousClosingTagName(html, newlineIndex);
  const nextTagName = getNextOpeningTagName(html, newlineIndex);
  if (!prevTagName || !nextTagName) {
    return false;
  }
  return (
    INLINE_BREAK_TAGS.has(prevTagName) && INLINE_BREAK_TAGS.has(nextTagName)
  );
}

function getPreviousClosingTagName(html: string, newlineIndex: number) {
  const before = html.slice(0, newlineIndex);
  const match = before.match(/<\/([a-z0-9]+)\s*>\s*$/i);
  return match ? match[1].toLowerCase() : null;
}

function getNextOpeningTagName(html: string, newlineIndex: number) {
  const after = html.slice(newlineIndex + 1);
  const match = after.match(/^\s*<([a-z0-9]+)(\s|>)/i);
  return match ? match[1].toLowerCase() : null;
}

function findPreviousNonWhitespace(str: string, start: number) {
  for (let i = start; i >= 0; i--) {
    const char = str[i];
    if (!char) continue;
    if (char.trim()) {
      return char;
    }
  }
  return '';
}

function findNextNonWhitespace(str: string, start: number) {
  for (let i = start; i < str.length; i++) {
    const char = str[i];
    if (!char) continue;
    if (char.trim()) {
      return char;
    }
  }
  return '';
}

function isWithinPreservedTag(
  lowerHtml: string,
  index: number,
  tagNames: string[]
) {
  return tagNames.some((tag) => {
    const openTagIndex = lowerHtml.lastIndexOf(`<${tag}`, index);
    if (openTagIndex === -1) {
      return false;
    }
    const closeTagIndex = lowerHtml.lastIndexOf(`</${tag}>`, index);
    return openTagIndex > closeTagIndex;
  });
}

function preprocessNonCode(
  text: string,
  options?: {
    isAIMessage?: boolean;
    isAtStart?: boolean;
    isAtEnd?: boolean;
  }
) {
  let processedText = text;

  const PLACEHOLDERS: string[] = [];
  function protect(regex: RegExp) {
    processedText = processedText.replace(regex, (match) => {
      const idx = PLACEHOLDERS.push(match.replace(/_/g, '%5F')) - 1;
      return `%%PH${idx}%%`;
    });
  }
  function unprotect() {
    processedText = processedText.replace(
      /%%PH(\d+)%%/g,
      (_, i) => PLACEHOLDERS[+i]
    );
  }

  protect(/(?:https?:\/\/|www\.|\/users\/)[^\s<>()]+/g);
  protect(/@[A-Za-z0-9_]{3,}/g);

  if (!options?.isAIMessage) {
    if (processedText.includes('<')) {
      processedText = processedText.replace(/</g, '&lt;');
    }
    if (processedText.includes('>')) {
      processedText = processedText.replace(/>/g, '&gt;');
    }
    if (processedText.includes('=')) {
      processedText = processedText.replace(/=/g, '\\=');
    }
    if (processedText.includes('-')) {
      processedText = processedText.replace(/-(?!\s\[[x ]\])/g, '\\-');
    }
    if (processedText.includes('+')) {
      processedText = processedText.replace(/\+/g, '&#43;');
    }
  }

  const lines = processedText.split('\n');
  const tablePattern = /\|.*\|.*\|/;
  const containsTable = lines.some((line) => tablePattern.test(line));

  if (containsTable) {
    const isTableLine = (line: string) => tablePattern.test(line.trim());
    const restoreTableSyntax = (line: string) =>
      line.replace(/\\-/g, '-').replace(/&#43;/g, '+');
    processedText = lines
      .map((line) =>
        isTableLine(line)
          ? restoreTableSyntax(line)
          : line.replace(/_/g, '\\_')
      )
      .join('\n');
  } else if (processedText.includes('_')) {
    processedText = processedText.replace(/_/g, '\\_');
  }

  unprotect();

  processedText = ensureListBreakBeforeLabels(processedText);

  if (options?.isAIMessage) {
    return processedText;
  }

  const maxNbsp = 9;
  let nbspCount = 0;
  let inList = false;
  let lastLineWasList = false;
  const startsWithBoundaryNewline =
    !options?.isAtStart && text.startsWith('\n');
  const endsWithBoundaryNewline = !options?.isAtEnd && text.endsWith('\n');

  const listLineRegex = /^\s*(?:[*+\-]|•|\d+\.)\s+/;
  const processedLines = processedText.split('\n').map((line, index, arr) => {
    const trimmedLine = line.trim();
    const isList = listLineRegex.test(trimmedLine);
    const isLeadingBoundaryLine =
      startsWithBoundaryNewline && index === 0 && trimmedLine === '';
    const isTrailingBoundaryLine =
      endsWithBoundaryNewline &&
      index === arr.length - 1 &&
      trimmedLine === '';
    const shouldPreserveBoundaryLine =
      isLeadingBoundaryLine || isTrailingBoundaryLine;

    if (isList) {
      inList = true;
      lastLineWasList = true;
    } else if (trimmedLine === '' && inList) {
      inList = false;
      lastLineWasList = true;
    } else if (trimmedLine !== '') {
      lastLineWasList = false;
    }

    if (
      trimmedLine === '' &&
      !shouldPreserveBoundaryLine &&
      !lastLineWasList &&
      nbspCount < maxNbsp
    ) {
      if (line === '') {
        nbspCount++;
        return '&nbsp;';
      }
      return line;
    }
    return line;
  });

  return processedLines.join('\n');
}

function ensureListBreakBeforeLabels(text: string) {
  if (!text) {
    return text;
  }
  const angleLabelPattern = '(?:&lt;|&#x3C;)[^>\\n]+(?:>|&gt;)';
  const strongLabelPattern = '(?:\\*\\*|__)[^\\n]+?:(?:\\*\\*|__)';
  const emLabelPattern = '(?:\\*|_)[^\\n]+?:(?:\\*|_)';
  const labelPattern = `(?:${angleLabelPattern}|${strongLabelPattern}|${emLabelPattern})`;
  const listLinePattern = '(?:[*+\\-]|\\d+\\.|•)';
  const regex = new RegExp(
    `(^|\\n)(\\s*${listLinePattern}\\s[^\\n]+)\\n(\\s*${labelPattern})`,
    'g'
  );
  return text.replace(regex, (_, prefix, listLine, labelLine) => {
    return `${prefix || ''}${listLine}\n\n${labelLine}`;
  });
}
