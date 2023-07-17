import React from 'react';
import SummonerBadge from './summoner.png';
import ItemPanel from '../ItemPanel';

export default function Summoner({
  data: { isUnlocked, title, description },
  style
}: {
  data: {
    isUnlocked: boolean;
    title: string;
    description: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemPanel
      style={style}
      isUnlocked={isUnlocked}
      itemName={title}
      description={description}
      requirements={['Unlock the AI Card Summoner License']}
      badgeSrc={SummonerBadge}
    />
  );
}
