import React from 'react';
import GoldBadge from '~/assets/gold.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Grammar({
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
      progressObj={progressObj}
      badgeSrc={GoldBadge}
    />
  );
}
