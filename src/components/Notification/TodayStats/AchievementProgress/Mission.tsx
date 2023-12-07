import React from 'react';
import MissionBadge from '~/assets/mission.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Mission({
  thumbSize,
  data: { title, progressObj }
}: {
  thumbSize?: string;
  data: {
    progressObj: { label: string; currentValue: number; targetValue: number };
    title: string;
  };
}) {
  return (
    <ItemThumbPanel
      thumbSize={thumbSize}
      itemName={title}
      badgeSrc={MissionBadge}
      progressObj={progressObj}
    />
  );
}
