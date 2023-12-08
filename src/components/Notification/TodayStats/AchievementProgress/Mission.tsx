import React from 'react';
import MissionBadge from '~/assets/mission.png';
import ItemThumb from './ItemThumb';

export default function Mission({
  isUnlocked,
  thumbSize,
  data
}: {
  isUnlocked?: boolean;
  thumbSize?: string;
  data: any;
}) {
  return (
    <ItemThumb
      isUnlocked={isUnlocked}
      thumbSize={thumbSize}
      badgeSrc={MissionBadge}
      achievement={data}
    />
  );
}
