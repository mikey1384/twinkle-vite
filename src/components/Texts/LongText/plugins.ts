import { visit } from 'unist-util-visit';

type FontSize = 'huge' | 'big' | 'small' | 'tiny';

interface SplitString {
  text: string;
  isMatch: boolean;
  size?: FontSize;
}

export function remarkMentions() {
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

export function remarkLegacyTextSize() {
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
      const splitSentenceParts = splitStringByMatch(node.value);
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

function splitStringByMatch(str: string): SplitString[] {
  const regexObj: { [K in FontSize]: RegExp } = {
    huge: /h\[(.+?)\]h/,
    big: /b\[(.+?)\]b/,
    small: /s\[(.+?)\]s/,
    tiny: /t\[(.+?)\]t/
  };

  const regexGlobal = /(?:h\[(.+?)\]h|b\[(.+?)\]b|s\[(.+?)\]s|t\[(.+?)\]t)/g;
  let match: RegExpExecArray | null;
  const result: SplitString[] = [];

  let lastIndex = 0;

  while ((match = regexGlobal.exec(str)) !== null) {
    const beforeMatch = str.slice(lastIndex, match.index);
    if (beforeMatch.length > 0) {
      result.push({ text: beforeMatch, isMatch: false });
    }

    for (const key in regexObj) {
      const innerMatch = regexObj[key as FontSize].exec(match[0]);
      if (innerMatch) {
        result.push({
          text: innerMatch[1],
          isMatch: true,
          size: key as FontSize
        });
        break;
      }
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < str.length) {
    result.push({ text: str.slice(lastIndex), isMatch: false });
  }

  return result;
}
