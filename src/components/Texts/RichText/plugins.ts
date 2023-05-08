import { visit } from 'unist-util-visit';

export function mentions() {
  const isFakeMention: {
    [key: string]: boolean;
  } = {};
  return (tree: any) => {
    visit(tree, 'text', (node, index, parent) => {
      if (typeof node.value !== 'string') return;
      if (parent.type === 'link') return;
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
