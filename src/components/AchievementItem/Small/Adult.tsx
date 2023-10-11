import React from 'react';
import TeenagerBadge from '~/assets/adult.png';
import ItemThumbPanel from './ItemThumbPanel';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function Adult({
  isThumb,
  thumbSize,
  data: { title },
  style
}: {
  isThumb?: boolean;
  thumbSize?: string;
  data: {
    ap: number;
    isUnlocked: boolean;
    title: string;
    description: string;
    unlockMessage: string;
    milestones: { name: string; completed: boolean }[];
  };
  style?: React.CSSProperties;
}) {
  return (
    <ErrorBoundary componentPath="AchievementItems/Small/Adult">
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
