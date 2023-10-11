import React from 'react';
import SageBadge from '~/assets/sage.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Sage({
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
      badgeSrc={SageBadge}
      style={style}
    />
  );
}
