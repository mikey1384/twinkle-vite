import React from 'react';
import MissionBadge from '~/assets/mission.png';
import ItemThumb from './ItemThumb';

export default function Mission({
  isUnlocked,
  thumbSize,
  data: { title, progressObj }
}: {
  isUnlocked?: boolean;
  thumbSize?: string;
  data: {
    progressObj: { label: string; currentValue: number; targetValue: number };
    title: string;
  };
}) {
  return (
    <ItemThumb
      isUnlocked={isUnlocked}
      thumbSize={thumbSize}
      itemName={title}
      badgeSrc={MissionBadge}
      progressObj={progressObj}
    />
  );
}
