import React from 'react';
import TeenagerBadge from '~/assets/teenager.png';
import ItemThumbPanel from './ItemThumbPanel';
import ErrorBoundary from '~/components/ErrorBoundary';

export default function Teenager({
  data: { title },
  style
}: {
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ErrorBoundary componentPath="AchievementItems/Teenager">
      <ItemThumbPanel itemName={title} badgeSrc={TeenagerBadge} style={style} />
    </ErrorBoundary>
  );
}
