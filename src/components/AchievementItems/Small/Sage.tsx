import React from 'react';
import SageBadge from '~/assets/sage.png';
import ItemThumbPanel from './ItemThumbPanel';

export default function Sage({
  data: { title },
  style
}: {
  data: {
    title: string;
  };
  style?: React.CSSProperties;
}) {
  return <ItemThumbPanel itemName={title} badgeSrc={SageBadge} style={style} />;
}
