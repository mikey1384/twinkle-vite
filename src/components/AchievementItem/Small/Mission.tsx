import React from 'react';
import MissionBadge from '~/assets/mission.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Mission({
  data: { title },
  style
}: {
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemThumbPanel itemName={title} badgeSrc={MissionBadge} style={style} />
  );
}
