import React from 'react';
import GoldBadge from '~/assets/badges-small/gold.webp';
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
      badgeSrc={GoldBadge}
      style={style}
    />
  );
}
