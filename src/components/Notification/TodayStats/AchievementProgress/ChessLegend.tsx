import React from 'react';
import ChessLegendBadge from '~/assets/badges-small/chess-legend.webp';
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
