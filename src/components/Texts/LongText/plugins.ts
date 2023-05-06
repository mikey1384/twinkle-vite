import { visit } from 'unist-util-visit';

type FontSize = 'huge' | 'big' | 'small' | 'tiny';
type Color =
  | 'blue'
  | 'gray'
  | 'green'
  | 'lime'
  | 'logoBlue'
  | 'orange'
  | 'passionFruit'
  | 'pink'
  | 'purple'
  | 'red'
  | 'yellow';

interface SplitStringForFontSize {
  text: string;
  isMatch: boolean;
  size?: FontSize;
}
interface SplitStringForColor {
  text: string;
  isMatch: boolean;
  color?: Color;
}

export function mentions() {
  const isFakeMention: {
    [key: string]: boolean;
  } = {};
  return (tree: any) => {
    visit(tree, 'text', (node, index, parent) => {
      if (typeof node.value !== 'string') return;
      const mentions = node.value.split(/(@\w+|＠\w+)/g);
      if (mentions.length <= 1) return;
      const newNodes = mentions
        .filter((text: string) => text)
        .map((text: string) => {
          if (/^＠\w+$/.test(text)) {
            isFakeMention[text.replace('＠', '')] = true;
            return {
              type: 'text',
              value: text.replace('＠', '@')
            };
          }
          const match = /^@\w+$/.test(text);
          if (match && !isFakeMention[text.slice(1)]) {
            const mentionUrl = `/users/${text.slice(1)}`;
            return {
              type: 'link',
              url: mentionUrl,
              data: {
                hProperties: {
                  className: 'mention'
                },
                hChildren: [{ type: 'text', value: text }]
              }
            };
          }
          return { type: 'text', value: text };
        });
      parent.children.splice(index, 1, ...newNodes);
    });
  };
}

export function legacyTextSize() {
  const fontSizes: {
    [K in FontSize]: string;
  } = {
    huge: '1.9em',
    big: '1.4em',
    small: '0.7em',
    tiny: '0.5em'
  };
  return (tree: any) => {
    visit(tree, 'text', (node, index, parent) => {
      if (typeof node.value !== 'string') return;
      const splitSentenceParts = splitStringBySizeMatch(node.value);
      const newNodes: any[] = [];
      for (const part of splitSentenceParts) {
        if (part.isMatch) {
          newNodes.push({
            type: 'text',
            data: {
              hName: 'span',
              hProperties: {
                role: 'span',
                style: part.size ? `font-size: ${fontSizes[part.size]}` : ''
              },
              hChildren: [{ type: 'text', value: part.text }]
            }
          });
        } else {
          newNodes.push({ type: 'text', value: part.text });
        }
      }
      parent.children.splice(index, 1, ...newNodes);
    });
  };
}

function splitStringBySizeMatch(str: string): SplitStringForFontSize[] {
  const regexObj: { [K in FontSize]: RegExp } = {
    huge: /h\[(.+?)\]h/,
    big: /b\[(.+?)\]b/,
    small: /s\[(.+?)\]s/,
    tiny: /t\[(.+?)\]t/
  };

  const regexGlobal = /(?:h\[(.+?)\]h|b\[(.+?)\]b|s\[(.+?)\]s|t\[(.+?)\]t)/g;
  const result: SplitStringForFontSize[] = [];
  let selectedKey: FontSize | null = null;
  const match = regexGlobal.exec(str);
  if (!match) return [{ text: str, isMatch: false }];
  const beforeMatch = str.slice(0, match.index);
  if (beforeMatch.length > 0) {
    result.push({ text: beforeMatch, isMatch: false });
  }
  let innerMatch: RegExpExecArray | null = match;
  for (const key in regexObj) {
    innerMatch = regexObj[key as FontSize].exec(match[0]);
    if (innerMatch) {
      selectedKey = key as FontSize;
      break;
    }
  }
  const innerBeforeMatch = str.slice(match.index, innerMatch?.index);
  if (innerBeforeMatch.length > 0) {
    result.push({ text: innerBeforeMatch, isMatch: false });
  }
  result.push({
    text: innerMatch?.[1] || '',
    isMatch: true,
    size: selectedKey as FontSize
  });
  const lastIndex =
    match.index + (innerMatch?.index || 0) + (innerMatch?.[0]?.length || 0);
  if (lastIndex < str.length) {
    result.push({ text: str.slice(lastIndex), isMatch: false });
  }

  return result;
}

export function legacyTextColor() {
  const textColors: {
    [K in Color]: string;
  } = {
    blue: 'rgb(5,110,178)',
    gray: 'gray',
    green: 'rgb(40,182,44)',
    lime: 'lawngreen',
    logoBlue: 'rgb(65, 140, 235)',
    orange: 'orange',
    passionFruit: 'rgb(243,103,123)',
    pink: 'rgb(255,105,180)',
    purple: 'rgb(152,28,235)',
    red: 'red',
    yellow: 'rgb(255,210,0)'
  };

  return (tree: any) => {
    visit(tree, 'text', (node, index, parent) => {
      if (typeof node.value !== 'string') return;
      const splitSentenceParts = splitStringByColorMatch(node.value);
      const newNodes: any[] = [];
      for (const part of splitSentenceParts) {
        if (part.isMatch) {
          newNodes.push({
            type: 'text',
            data: {
              hName: 'span',
              hProperties: {
                role: 'span',
                style: part.color ? `color: ${textColors[part.color]};` : ''
              },
              hChildren: [{ type: 'text', value: part.text }]
            }
          });
        } else {
          newNodes.push({ type: 'text', value: part.text });
        }
      }
      parent.children.splice(index, 1, ...newNodes);
    });
  };
}

function splitStringByColorMatch(str: string): SplitStringForColor[] {
  const regexObj: { [K in Color]: RegExp } = {
    blue: /(((?![0-9.])b\|[^\s]+\|b(?![0-9]))|(((b\|[^\s]){1}((?!(b\||\|b))[^\n])+([^\s]\|b){1})(?![0-9.])))/gi,
    gray: /(((?![0-9.])gr\|[^\s]+\|gr(?![0-9]))|(((gr\|[^\s]){1}((?!(gr\||\|gr))[^\n])+([^\s]\|gr){1})(?![0-9.])))/gi,
    green:
      /(((?![0-9.])g\|[^\s]+\|g(?![0-9]))|(((g\|[^\s]){1}((?!(g\||\|g))[^\n])+([^\s]\|g){1})(?![0-9.])))/gi,
    lime: /(((?![0-9.])l\|[^\s]+\|l(?![0-9]))|(((l\|[^\s]){1}((?!(l\||\|l))[^\n])+([^\s]\|l){1})(?![0-9.])))/gi,
    logoBlue:
      /(((?![0-9.])lb\|[^\s]+\|lb(?![0-9]))|(((lb\|[^\s]){1}((?!(lb\||\|lb))[^\n])+([^\s]\|lb){1})(?![0-9.])))/gi,
    orange:
      /(((?![0-9.])o\|[^\s]+\|o(?![0-9]))|(((o\|[^\s]){1}((?!(o\||\|o))[^\n])+([^\s]\|o){1})(?![0-9.])))/gi,
    passionFruit:
      /(((?![0-9.])pf\|[^\s]+\|pf(?![0-9]))|(((pf\|[^\s]){1}((?!(pf\||\|pf))[^\n])+([^\s]\|pf){1})(?![0-9.])))/gi,
    pink: /(((?![0-9.])p\|[^\s]+\|p(?![0-9]))|(((p\|[^\s]){1}((?!(p\||\|p))[^\n])+([^\s]\|p){1})(?![0-9.])))/gi,
    purple:
      /(((?![0-9.])pu\|[^\s]+\|pu(?![0-9]))|(((pu\|[^\s]){1}((?!(pu\||\|pu))[^\n])+([^\s]\|pu){1})(?![0-9.])))/gi,
    red: /(((?![0-9.])r\|[^\s]+\|r(?![0-9]))|(((r\|[^\s]){1}((?!(r\||\|r))[^\n])+([^\s]\|r){1})(?![0-9.])))/gi,
    yellow:
      /(((?![0-9.])y\|[^\s]+\|y(?![0-9]))|(((y\|[^\s]){1}((?!(y\||\|y))[^\n])+([^\s]\|y){1})(?![0-9.])))/gi
  };
  const regexGlobal = new RegExp(
    Object.values(regexObj)
      .map((regex) => `(?:${regex.source})`)
      .join('|'),
    'gi'
  );
  const result: SplitStringForColor[] = [];
  let selectedKey: Color | null = null;
  const match = regexGlobal.exec(str);
  if (!match) return [{ text: str, isMatch: false }];
  const beforeMatch = str.slice(0, match.index);
  if (beforeMatch.length > 0) {
    result.push({ text: beforeMatch, isMatch: false });
  }
  let innerMatch: RegExpExecArray | null = match;
  for (const key in regexObj) {
    innerMatch = regexObj[key as Color].exec(match[0]);
    if (innerMatch) {
      selectedKey = key as Color;
      break;
    }
  }
  const innerBeforeMatch = str.slice(match.index, innerMatch?.index);
  if (innerBeforeMatch.length > 0) {
    result.push({ text: innerBeforeMatch, isMatch: false });
  }
  result.push({
    text: innerMatch?.[1] || '',
    isMatch: true,
    color: selectedKey as Color
  });
  const lastIndex =
    match.index + (innerMatch?.index || 0) + (innerMatch?.[0]?.length || 0);
  if (lastIndex < str.length) {
    result.push({ text: str.slice(lastIndex), isMatch: false });
  }

  return result;
}
