import React from 'react';
import ChessLegendBadge from '~/assets/chess-legend.png';
import ItemThumb from './ItemThumb';

export default function ChessLegend({
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
      badgeSrc={ChessLegendBadge}
      achievement={data}
    />
  );
}
