import React from 'react';
import GrammarBadge from '~/assets/grammar.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Grammar({
  isThumb,
  thumbSize,
  data: { title },
  style
}: {
  isThumb?: boolean;
  thumbSize?: string;
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemThumbPanel
      isThumb={isThumb}
      thumbSize={thumbSize}
      itemName={title}
      badgeSrc={GrammarBadge}
      style={style}
    />
  );
}
