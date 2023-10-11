import React from 'react';
import TeenagerBadge from '~/assets/adult.png';
import ItemThumbPanel from './ItemThumbPanel';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function Adult({
  isThumb,
  data: { title },
  style
}: {
  isThumb?: boolean;
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
        itemName={title}
        badgeSrc={TeenagerBadge}
        style={style}
      />
    </ErrorBoundary>
  );
}
