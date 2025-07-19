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
    title: string;
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
