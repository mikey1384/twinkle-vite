import React from 'react';
import MissionBadge from '~/assets/mission.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Mission({
  thumbSize,
  data: { title }
}: {
  thumbSize?: string;
  data: {
    title: string;
  };
}) {
  return (
    <ItemThumbPanel
      thumbSize={thumbSize}
      itemName={title}
      badgeSrc={MissionBadge}
    />
  );
}
