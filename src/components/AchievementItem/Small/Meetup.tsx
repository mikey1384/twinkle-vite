import React from 'react';
import MeetupBadge from '~/assets/meetup.png';
import ItemThumbPanel from './ItemThumbPanel';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function Meetup({
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
    <ErrorBoundary componentPath="AchievementItems/Small/Meetup">
      <ItemThumbPanel
        isThumb={isThumb}
        thumbSize={thumbSize}
        itemName={title}
        badgeSrc={MeetupBadge}
        style={style}
      />
    </ErrorBoundary>
  );
}
