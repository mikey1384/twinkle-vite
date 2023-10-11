import React from 'react';
import SummonerBadge from '~/assets/summoner.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Summoner({
  isThumb,
  data: { title },
  style
}: {
  isThumb?: boolean;
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemThumbPanel
      isThumb={isThumb}
      itemName={title}
      badgeSrc={SummonerBadge}
      style={style}
    />
  );
}
