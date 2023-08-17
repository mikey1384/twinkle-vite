import React from 'react';
import SageBadge from '~/assets/sage.png';
import ItemPanel from '../ItemPanel';

export default function Sage({
  data: { ap, isUnlocked, title, description },
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
      requirement="Rise to the rank of Head Teacher at Twinkle Academy"
      badgeSrc={SageBadge}
    />
  );
}
