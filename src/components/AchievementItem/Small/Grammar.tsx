import React from 'react';
import GrammarBadge from '~/assets/grammar.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Grammar({
  data: { title },
  style
}: {
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemThumbPanel itemName={title} badgeSrc={GrammarBadge} style={style} />
  );
}
