import { visit } from 'unist-util-visit';
import { visitParents } from 'unist-util-visit-parents';

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

const sizeRegexObj: { [K in FontSize]: RegExp } = {
  huge: /h\[(.+?)\]h/,
  big: /b\[(.+?)\]b/,
  small: /s\[(.+?)\]s/,
  tiny: /t\[(.+?)\]t/
};
const sizeRegexGlobal = /(?:h\[(.+?)\]h|b\[(.+?)\]b|s\[(.+?)\]s|t\[(.+?)\]t)/g;
const colorRegexObj: { [K in Color]: RegExp } = {
  blue: /(?:b\|)([\s\S]+?)(?:\|b)/,
  gray: /(?:gr\|)([\s\S]+?)(?:\|gr)/,
  green: /(?:g\|)([\s\S]+?)(?:\|g)/,
  lime: /(?:l\|)([\s\S]+?)(?:\|l)/,
  logoBlue: /(?:lb\|)([\s\S]+?)(?:\|lb)/,
  orange: /(?:o\|)([\s\S]+?)(?:\|o)/,
  passionFruit: /(?:pf\|)([\s\S]+?)(?:\|pf)/,
  pink: /(?:p\|)([\s\S]+?)(?:\|p)/,
  purple: /(?:pu\|)([\s\S]+?)(?:\|pu)/,
  red: /(?:r\|)([\s\S]+?)(?:\|r)/,
  yellow: /(?:y\|)([\s\S]+?)(?:\|y)/
};
const colorRegexGlobal = new RegExp(
  Object.values(colorRegexObj)
    .map((regex) => `(?:${regex.source})`)
    .join('|'),
  'gi'
);

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

export function legacyTextStyling() {
  const fontSizes: {
    [K in FontSize]: string;
  } = {
    huge: '1.9em',
    big: '1.4em',
    small: '0.7em',
    tiny: '0.5em'
  };
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
    visitParents(tree, (node, ancestors) => {
      if (node.type !== 'text') return;

      const parent = ancestors[ancestors.length - 1];
      const index = parent.children.indexOf(node);

      if (typeof node.value !== 'string') return;

      const firstMatchType = getFirstMatchType(node.value);
      let splitSentenceParts: {
        text: string;
        isMatch: boolean;
        size?: FontSize;
        color?: Color;
      }[] = [];
      if (firstMatchType === 'color') {
        splitSentenceParts = splitStringByColorMatch(node.value);
      } else if (firstMatchType === 'size') {
        splitSentenceParts = splitStringBySizeMatch(node.value);
      } else {
        parent.children.splice(index, 1, { type: 'text', value: node.value });
        return;
      }
      const newNodes: any[] = [];

      for (const part of splitSentenceParts) {
        if (part.isMatch) {
          let subParts: {
            text: string;
            isMatch: boolean;
            size?: FontSize;
            color?: Color;
          }[] = [];
          if (firstMatchType === 'color') {
            subParts = splitStringBySizeMatch(part.text);
          } else {
            subParts = splitStringByColorMatch(part.text);
          }
          const hChildren = subParts.map((subPart) => {
            if (subPart.isMatch) {
              return {
                type: 'element',
                tagName: 'span',
                properties: {
                  role: 'span',
                  style: `
                    ${
                      subPart.size
                        ? `font-size: ${fontSizes[subPart.size]};`
                        : ''
                    }
                    ${
                      subPart.color
                        ? `color: ${textColors[subPart.color]};`
                        : ''
                    }
                  `.trim()
                },
                children: [{ type: 'text', value: subPart.text }]
              };
            } else {
              return { type: 'text', value: subPart.text };
            }
          });
          newNodes.push({
            type: 'text',
            data: {
              hName: 'span',
              hProperties: {
                role: 'span',
                style: `
                  ${part.size ? `font-size: ${fontSizes[part.size]};` : ''}
                  ${part.color ? `color: ${textColors[part.color]};` : ''}
                `.trim()
              },
              hChildren
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

function getFirstMatchType(text: string): 'color' | 'size' | null {
  colorRegexGlobal.lastIndex = 0;
  sizeRegexGlobal.lastIndex = 0;
  const colorMatch = colorRegexGlobal.exec(text);
  const sizeMatch = sizeRegexGlobal.exec(text);

  if (!colorMatch && !sizeMatch) return null;
  if (!colorMatch) return 'size';
  if (!sizeMatch) return 'color';

  return colorMatch.index < sizeMatch.index ? 'color' : 'size';
}

function splitStringBySizeMatch(str: string): SplitStringForFontSize[] {
  sizeRegexGlobal.lastIndex = 0;
  function recursiveSplit(
    str: string,
    startIndex: number
  ): SplitStringForFontSize[] {
    let selectedKey: FontSize | null = null;
    const result: SplitStringForFontSize[] = [];
    const match = sizeRegexGlobal.exec(str);

    if (!match) {
      return [{ text: str.slice(startIndex), isMatch: false }];
    }

    const beforeMatch = str.slice(startIndex, match.index);
    if (beforeMatch.length > 0) {
      result.push({ text: beforeMatch, isMatch: false });
    }

    let innerMatch: RegExpExecArray | null = null;
    let minIndex = Infinity;
    for (const key in sizeRegexObj) {
      const currentMatch = sizeRegexObj[key as FontSize].exec(match[0]);
      if (currentMatch && currentMatch.index < minIndex) {
        innerMatch = currentMatch;
        selectedKey = key as FontSize;
        minIndex = currentMatch.index;
      }
    }
    result.push({
      text: innerMatch?.[1] || '',
      isMatch: true,
      size: selectedKey as FontSize
    });

    const lastIndex = match.index + (innerMatch?.[0]?.length || 0);
    if (lastIndex < str.length) {
      result.push(...recursiveSplit(str, lastIndex));
    }

    return result;
  }

  return recursiveSplit(str, 0);
}

function splitStringByColorMatch(str: string): SplitStringForColor[] {
  colorRegexGlobal.lastIndex = 0;
  function recursiveSplit(
    str: string,
    startIndex: number
  ): SplitStringForColor[] {
    let selectedKey: Color | null = null;
    const result: SplitStringForColor[] = [];
    const match = colorRegexGlobal.exec(str);

    if (!match) {
      return [{ text: str.slice(startIndex), isMatch: false }];
    }

    const beforeMatch = str.slice(startIndex, match.index);
    if (beforeMatch.length > 0) {
      result.push({ text: beforeMatch, isMatch: false });
    }

    let innerMatch: RegExpExecArray | null = null;
    let minIndex = Infinity;

    for (const key in colorRegexObj) {
      const currentMatch = colorRegexObj[key as Color].exec(match[0]);
      if (currentMatch && currentMatch.index < minIndex) {
        innerMatch = currentMatch;
        selectedKey = key as Color;
        minIndex = currentMatch.index;
      }
    }
    result.push({
      text: innerMatch?.[1] || '',
      isMatch: true,
      color: selectedKey as Color
    });

    const lastIndex = match.index + (innerMatch?.[0]?.length || 0);
    if (lastIndex < str.length) {
      result.push(...recursiveSplit(str, lastIndex));
    }

    return result;
  }

  return recursiveSplit(str, 0);
}
