import React from 'react';
import FounderBadge from '~/assets/founder.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function TwinkleFounder({
  data: { title },
  style
}: {
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemThumbPanel itemName={title} badgeSrc={FounderBadge} style={style} />
  );
}
