import React from 'react';
import TeenagerBadge from '~/assets/teenager.png';
import ItemThumbPanel from './ItemThumbPanel';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function Teenager({
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
    <ErrorBoundary componentPath="AchievementItems/Teenager">
      <ItemThumbPanel
        isThumb={isThumb}
        thumbSize={thumbSize}
        itemName={title}
        badgeSrc={TeenagerBadge}
        style={style}
      />
    </ErrorBoundary>
  );
}
