import React from 'react';
import FounderBadge from './founder.png';
import ItemPanel from '../ItemPanel';

export default function Founder({
  data: { title, description },
  style
}: {
  data: {
    title: string;
    description: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemPanel
      style={style}
      itemName={title}
      description={description}
      requirements={['Found a new business']}
      badgeSrc={FounderBadge}
    />
  );
}
