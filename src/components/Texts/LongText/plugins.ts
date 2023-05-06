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
      const splitSentenceParts = splitStringBySizeMatch(node.value);
      const newNodes: any[] = [];
      for (const part of splitSentenceParts) {
        if (part.isMatch) {
          const colorParts = splitStringByColorMatch(part.text);
          const hChildren = colorParts.map((colorPart) => {
            if (colorPart.isMatch) {
              return {
                type: 'element',
                tagName: 'span',
                properties: {
                  role: 'span',
                  style: colorPart.color
                    ? `color: ${textColors[colorPart.color]};`
                    : ''
                },
                children: [{ type: 'text', value: colorPart.text }]
              };
            } else {
              return { type: 'text', value: colorPart.text };
            }
          });
          newNodes.push({
            type: 'text',
            data: {
              hName: 'span',
              hProperties: {
                role: 'span',
                style: part.size ? `font-size: ${fontSizes[part.size]}` : ''
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

export function legacyTextColor() {
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
      const splitSentenceParts = splitStringByColorMatch(node.value);
      const newNodes: any[] = [];
      for (const part of splitSentenceParts) {
        if (part.isMatch) {
          const sizeParts = splitStringBySizeMatch(part.text);
          const hChildren = sizeParts.map((sizePart) => {
            if (sizePart.isMatch) {
              return {
                type: 'element',
                tagName: 'span',
                properties: {
                  role: 'span',
                  style: sizePart.size
                    ? `font-size: ${fontSizes[sizePart.size]}`
                    : ''
                },
                children: [{ type: 'text', value: sizePart.text }]
              };
            } else {
              return { type: 'text', value: sizePart.text };
            }
          });
          newNodes.push({
            type: 'text',
            data: {
              hName: 'span',
              hProperties: {
                role: 'span',
                style: part.color ? `color: ${textColors[part.color]};` : ''
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

function splitStringBySizeMatch(str: string): SplitStringForFontSize[] {
  const regexObj: { [K in FontSize]: RegExp } = {
    huge: /h\[(.+?)\]h/,
    big: /b\[(.+?)\]b/,
    small: /s\[(.+?)\]s/,
    tiny: /t\[(.+?)\]t/
  };

  const regexGlobal = /(?:h\[(.+?)\]h|b\[(.+?)\]b|s\[(.+?)\]s|t\[(.+?)\]t)/g;

  function recursiveSplit(
    str: string,
    startIndex: number
  ): SplitStringForFontSize[] {
    let selectedKey: FontSize | null = null;
    const result: SplitStringForFontSize[] = [];
    const match = regexGlobal.exec(str);

    if (!match) {
      return [{ text: str.slice(startIndex), isMatch: false }];
    }

    const beforeMatch = str.slice(startIndex, match.index);
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
  const regexObj: { [K in Color]: RegExp } = {
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
  const regexGlobal = new RegExp(
    Object.values(regexObj)
      .map((regex) => `(?:${regex.source})`)
      .join('|'),
    'gi'
  );
  function recursiveSplit(
    str: string,
    startIndex: number
  ): SplitStringForColor[] {
    let selectedKey: Color | null = null;
    const result: SplitStringForColor[] = [];
    const match = regexGlobal.exec(str);

    if (!match) {
      return [{ text: str.slice(startIndex), isMatch: false }];
    }

    const beforeMatch = str.slice(startIndex, match.index);
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
