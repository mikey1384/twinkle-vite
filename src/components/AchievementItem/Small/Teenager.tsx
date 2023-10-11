import React from 'react';
import TeenagerBadge from '~/assets/teenager.png';
import ItemThumbPanel from './ItemThumbPanel';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function Teenager({
  isThumb,
  data: { title },
  style
}: {
  isThumb?: boolean;
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ErrorBoundary componentPath="AchievementItems/Teenager">
      <ItemThumbPanel
        isThumb={isThumb}
        itemName={title}
        badgeSrc={TeenagerBadge}
        style={style}
      />
    </ErrorBoundary>
  );
}
