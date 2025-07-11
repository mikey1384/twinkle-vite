import React from 'react';
import DonorBadge from '~/assets/donor.png';
import ItemThumbPanel from './ItemThumbPanel';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function Donor({
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
    <ErrorBoundary componentPath="AchievementItems/Small/Donor">
      <ItemThumbPanel
        isThumb={isThumb}
        thumbSize={thumbSize}
        itemName={title}
        badgeSrc={DonorBadge}
        style={style}
      />
    </ErrorBoundary>
  );
}
