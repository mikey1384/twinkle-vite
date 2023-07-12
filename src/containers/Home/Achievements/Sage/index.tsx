import React from 'react';
import SageBadge from './sage.png';
import ItemPanel from '../ItemPanel';

export default function Sage({ style }: { style?: React.CSSProperties }) {
  return (
    <ItemPanel
      style={style}
      itemName="The Sage of Twinkle"
      description="This highest honor is bestowed only upon those who have risen to the rank of Head Teacher or above at Twinkle Academy. As a Sage of Twinkle, you are a leader, an innovator, and a beacon of knowledge. Stand tall, for you light the path of learning for all."
      requirements={['Rise to the rank of Head Teacher']}
      badgeSrc={SageBadge}
    />
  );
}
