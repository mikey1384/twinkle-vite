import React from 'react';
import SageBadge from '~/assets/sage.png';
import ItemPanel from './ItemPanel';

export default function Sage({
  isNotification,
  data: { ap, isUnlocked, title, description, unlockMessage },
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
      requirement="Rise to the rank of Head Teacher at Twinkle Academy"
      badgeSrc={SageBadge}
    />
  );
}
