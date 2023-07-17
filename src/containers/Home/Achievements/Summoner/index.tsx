import React from 'react';
import SummonerBadge from './summoner.png';
import ItemPanel from '../ItemPanel';

export default function Summoner({
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
      requirements={['Unlock the AI Card Summoner License']}
      badgeSrc={SummonerBadge}
    />
  );
}
