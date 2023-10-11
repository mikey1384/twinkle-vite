import React from 'react';
import TeenagerBadge from '~/assets/adult.png';
import ItemThumbPanel from './ItemThumbPanel';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function Adult({
  data: { title },
  style
}: {
  isNotification?: boolean;
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
      <ItemThumbPanel itemName={title} badgeSrc={TeenagerBadge} style={style} />
    </ErrorBoundary>
  );
}
