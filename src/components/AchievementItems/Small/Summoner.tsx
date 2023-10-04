import React from 'react';
import SummonerBadge from '~/assets/summoner.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Summoner({
  data: { title },
  style
}: {
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemThumbPanel itemName={title} badgeSrc={SummonerBadge} style={style} />
  );
}
