import React from 'react';
import MentorBadge from './mentor.png';
import ItemPanel from '../ItemPanel';

export default function Mentor({
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
      requirements={['Take a full-time teaching position at Twinkle Academy']}
      badgeSrc={MentorBadge}
    />
  );
}
