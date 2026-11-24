import React from 'react';
import ItemThumbPanel from './ItemThumbPanel';
import ChessLegendBadge from '~/assets/badges-small/chess-legend.webp';

export default function ChessLegend({
  isThumb,
  thumbSize,
  data: { title },
  style
}: {
  isThumb?: boolean;
  thumbSize?: string;
  data: { title: string };
  style?: React.CSSProperties;
}) {
  return (
    <ItemThumbPanel
      isThumb={isThumb}
      thumbSize={thumbSize}
      itemName={title}
      badgeSrc={ChessLegendBadge}
      style={style}
    />
  );
}
