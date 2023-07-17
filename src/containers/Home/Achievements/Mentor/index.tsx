import React from 'react';
import MentorBadge from './mentor.png';
import ItemPanel from '../ItemPanel';

export default function Mentor({
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
      requirements={['Take a full-time teaching position at Twinkle Academy']}
      badgeSrc={MentorBadge}
    />
  );
}
