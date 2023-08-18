import React from 'react';
import SummonerBadge from '~/assets/summoner.png';
import ItemPanel from './ItemPanel';

export default function Summoner({
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
      requirement="Unlock the AI Card Summoner License"
      badgeSrc={SummonerBadge}
    />
  );
}
