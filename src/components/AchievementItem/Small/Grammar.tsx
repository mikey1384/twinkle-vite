import React from 'react';
import GrammarBadge from '~/assets/grammar.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Grammar({
  isThumb,
  data: { title },
  style
}: {
  isThumb?: boolean;
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemThumbPanel
      isThumb={isThumb}
      itemName={title}
      badgeSrc={GrammarBadge}
      style={style}
    />
  );
}
