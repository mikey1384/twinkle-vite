import React from 'react';
import SageBadge from './sage.png';
import ItemPanel from '../ItemPanel';

export default function Sage({
  data: { title, description },
  style
}: {
  data: {
    title: string;
    description: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemPanel
      style={style}
      itemName={title}
      description={description}
      requirements={['Rise to the rank of Head Teacher']}
      badgeSrc={SageBadge}
    />
  );
}
