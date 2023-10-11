import React from 'react';
import FounderBadge from '~/assets/founder.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Founder({
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
      badgeSrc={FounderBadge}
      style={style}
    />
  );
}
