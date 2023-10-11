import React from 'react';
import SageBadge from '~/assets/sage.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Sage({
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
      badgeSrc={SageBadge}
      style={style}
    />
  );
}
