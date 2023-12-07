import React from 'react';
import MissionBadge from '~/assets/mission.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Mission({
  thumbSize,
  data: { title },
  style
}: {
  thumbSize?: string;
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemThumbPanel
      thumbSize={thumbSize}
      itemName={title}
      badgeSrc={MissionBadge}
      style={style}
    />
  );
}
