import React from 'react';
import SageBadge from './sage.png';
import ItemPanel from '../ItemPanel';

export default function Sage({
  data: { isUnlocked, title, description },
  style
}: {
  data: {
    isUnlocked: boolean;
    title: string;
    description: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemPanel
      style={style}
      isUnlocked={isUnlocked}
      itemName={title}
      description={description}
      requirements={['Rise to the rank of Head Teacher']}
      badgeSrc={SageBadge}
    />
  );
}
