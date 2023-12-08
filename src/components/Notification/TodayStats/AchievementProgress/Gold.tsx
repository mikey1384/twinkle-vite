import React from 'react';
import GoldBadge from '~/assets/gold.png';
import ItemThumb from './ItemThumb';

export default function Grammar({
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
      badgeSrc={GoldBadge}
      achievement={data}
    />
  );
}
