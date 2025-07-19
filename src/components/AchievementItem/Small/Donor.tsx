import React from 'react';
import DonorBadge from '~/assets/donor.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Donor({
  isThumb,
  thumbSize,
  data: { title },
  style
}: {
  isThumb?: boolean;
  thumbSize?: string;
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemThumbPanel
      isThumb={isThumb}
      thumbSize={thumbSize}
      itemName={title}
      badgeSrc={DonorBadge}
      style={style}
    />
  );
}
