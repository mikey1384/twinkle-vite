import React from 'react';
import GoldBadge from '~/assets/gold.png';
import ItemThumb from './ItemThumb';

export default function Grammar({
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
      progressObj={progressObj}
      badgeSrc={GoldBadge}
    />
  );
}
