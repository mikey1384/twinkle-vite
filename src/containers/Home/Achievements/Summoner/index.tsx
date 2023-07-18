import React from 'react';
import SummonerBadge from './summoner.png';
import ItemPanel from '../ItemPanel';

export default function Summoner({
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
      requirement="Unlock the AI Card Summoner License"
      badgeSrc={SummonerBadge}
    />
  );
}
