const CURRENCY_PLACEHOLDER_PREFIX = 'TWINKLECURRENCY';
const CURRENCY_PLACEHOLDER_SUFFIX = 'ENDTWINKLECURRENCY';
const CURRENCY_REGEX =
  /\$((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)(?![\d$a-zA-Z(^_{}]|\.\d)/g;
const CURRENCY_START_REGEX =
  /^\$(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?(?![\d$a-zA-Z(^_{}]|\.\d)/;
const CURRENCY_PLACEHOLDER_REGEX =
  /TWINKLECURRENCY((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?)ENDTWINKLECURRENCY/g;

interface ProtectedRange {
  start: number;
  end: number;
}

export function protectCurrencyLiteralsOutsideMath(text: string): string {
  if (!text.includes('$')) {
    return text;
  }

  let result = '';
  let index = 0;

  while (index < text.length) {
    const protectedRange = findNextProtectedRange(text, index);
    if (!protectedRange) {
      result += protectCurrencySegment(text.slice(index));
      break;
    }

    result += protectCurrencySegment(text.slice(index, protectedRange.start));
    result += text.slice(protectedRange.start, protectedRange.end);
    index = protectedRange.end;
  }

  return result;
}

export function restoreCurrencyPlaceholders(text: string): string {
  return text.replace(CURRENCY_PLACEHOLDER_REGEX, (_, currencyValue: string) => {
    return `$${currencyValue}`;
  });
}

function protectCurrencySegment(text: string): string {
  return text.replace(CURRENCY_REGEX, (_, currencyValue: string) => {
    return `${CURRENCY_PLACEHOLDER_PREFIX}${currencyValue}${CURRENCY_PLACEHOLDER_SUFFIX}`;
  });
}

function findNextProtectedRange(
  text: string,
  startIndex: number
): ProtectedRange | null {
  for (let index = startIndex; index < text.length; index++) {
    if (text.startsWith('```', index)) {
      const endIndex = text.indexOf('```', index + 3);
      if (endIndex !== -1) {
        return { start: index, end: endIndex + 3 };
      }
    }

    if (text[index] === '`') {
      const endIndex = text.indexOf('`', index + 1);
      if (endIndex !== -1) {
        return { start: index, end: endIndex + 1 };
      }
    }

    if (text.startsWith('$$', index)) {
      const endIndex = text.indexOf('$$', index + 2);
      if (endIndex !== -1) {
        return { start: index, end: endIndex + 2 };
      }
    }

    if (text[index] === '$' && !isEscaped(text, index)) {
      const endIndex = findInlineMathEnd(text, index);
      if (endIndex !== -1) {
        return { start: index, end: endIndex + 1 };
      }
    }
  }

  return null;
}

function findInlineMathEnd(text: string, startIndex: number) {
  if (text[startIndex + 1] === '$') {
    return -1;
  }

  const firstContentChar = text[startIndex + 1];
  if (!firstContentChar || firstContentChar === '\n') {
    return -1;
  }

  if (isCurrencyLiteralStart(text, startIndex)) {
    return -1;
  }

  for (let index = startIndex + 1; index < text.length; index++) {
    const char = text[index];
    if (char === '\n') {
      return -1;
    }

    if (char !== '$' || isEscaped(text, index)) {
      continue;
    }

    const previousChar = text[index - 1] || '';
    const nextChar = text[index + 1] || '';
    if (
      text[index + 1] === '$' ||
      /\s/.test(previousChar) ||
      /\d/.test(nextChar)
    ) {
      continue;
    }

    const content = text.slice(startIndex + 1, index).trim();
    if (isLikelyMathContent(content)) {
      return index;
    }
  }

  return -1;
}

function isLikelyMathContent(content: string): boolean {
  if (!content) {
    return false;
  }

  if (/^[+-]?(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?$/.test(content)) {
    return true;
  }

  if (/[\\^_{}=<>+\-*/()]/.test(content)) {
    return true;
  }

  if (/^\d+(?:\.\d+)?[a-zA-Z]$/.test(content)) {
    return true;
  }

  return /^[a-zA-Z]$/.test(content);
}

function isCurrencyLiteralStart(text: string, index: number): boolean {
  return CURRENCY_START_REGEX.test(text.slice(index));
}

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === '\\'; cursor--) {
    slashCount++;
  }
  return slashCount % 2 === 1;
}
