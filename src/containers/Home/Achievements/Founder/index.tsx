import React from 'react';
import FounderBadge from '~/assets/founder.png';
import ItemPanel from '../ItemPanel';

export default function Founder({
  data: { isUnlocked, ap, title, description },
  style
}: {
  data: {
    ap: number;
    isUnlocked: boolean;
    title: string;
    description: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemPanel
      style={style}
      ap={ap}
      isUnlocked={isUnlocked}
      itemName={title}
      description={description}
      requirement="Found a new business"
      badgeSrc={FounderBadge}
    />
  );
}
