import React from 'react';
import DonorBadge from '~/assets/badges-small/donor.webp';
import ItemThumb from './ItemThumb';

export default function Donor({
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
      badgeSrc={DonorBadge}
      achievement={data}
    />
  );
}
