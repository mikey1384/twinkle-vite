import React from 'react';
import FounderBadge from '~/assets/founder.png';
import ItemPanel from './ItemPanel';

export default function Founder({
  isNotification,
  data: { isUnlocked, ap, title, description, unlockMessage },
  style
}: {
  isNotification?: boolean;
  data: {
    ap: number;
    isUnlocked: boolean;
    title: string;
    description: string;
    unlockMessage: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemPanel
      isNotification={isNotification}
      style={style}
      ap={ap}
      isUnlocked={isUnlocked}
      itemName={title}
      description={description}
      unlockMessage={unlockMessage}
      requirements={['Found a new business']}
      badgeSrc={FounderBadge}
    />
  );
}
