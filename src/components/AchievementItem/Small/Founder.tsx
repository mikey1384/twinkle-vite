import React from 'react';
import FounderBadge from '~/assets/founder.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Founder({
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
      badgeSrc={FounderBadge}
      style={style}
    />
  );
}
