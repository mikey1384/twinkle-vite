import React from 'react';
import MentorBadge from './mentor.png';
import ItemPanel from '../ItemPanel';

export default function Mentor({
  data: { ap, isUnlocked, title, description },
  style
}: {
  data: {
    ap: number;
    isUnlocked: boolean;
    title: string;
    description: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemPanel
      style={style}
      ap={ap}
      isUnlocked={isUnlocked}
      itemName={title}
      description={description}
      requirement="Take a full-time teaching position at Twinkle Academy"
      badgeSrc={MentorBadge}
    />
  );
}
