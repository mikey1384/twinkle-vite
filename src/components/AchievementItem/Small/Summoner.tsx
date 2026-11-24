import React from 'react';
import SummonerBadge from '~/assets/badges-small/summoner.webp';
import ItemThumbPanel from './ItemThumbPanel';

export default function Summoner({
  isThumb,
  thumbSize,
  data: { title },
  style
}: {
  isThumb?: boolean;
  thumbSize?: string;
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemThumbPanel
      thumbSize={thumbSize}
      isThumb={isThumb}
      itemName={title}
      badgeSrc={SummonerBadge}
      style={style}
    />
  );
}
