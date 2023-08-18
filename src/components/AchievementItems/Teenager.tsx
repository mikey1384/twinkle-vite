import React from 'react';
import TeenagerBadge from '~/assets/teenager.png';
import ItemPanel from './ItemPanel';

export default function Teenager({
  isNotification,
  data: { isUnlocked, ap, title, description },
  style
}: {
  isNotification?: boolean;
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
      isNotification={isNotification}
      style={style}
      ap={ap}
      isUnlocked={isUnlocked}
      itemName={title}
      description={description}
      requirement="Prove you're a teenager or older"
      badgeSrc={TeenagerBadge}
    />
  );
}
