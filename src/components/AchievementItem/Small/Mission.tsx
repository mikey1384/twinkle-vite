import React from 'react';
import MissionBadge from '~/assets/mission.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Mission({
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
      badgeSrc={MissionBadge}
      style={style}
    />
  );
}
