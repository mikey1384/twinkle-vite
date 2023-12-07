import React from 'react';
import GoldBadge from '~/assets/gold.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Grammar({
  thumbSize,
  data: { title },
  style
}: {
  thumbSize?: string;
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemThumbPanel
      thumbSize={thumbSize}
      itemName={title}
      badgeSrc={GoldBadge}
      style={style}
    />
  );
}
