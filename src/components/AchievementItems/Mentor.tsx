import React from 'react';
import MentorBadge from '~/assets/mentor.png';
import ItemPanel from './ItemPanel';

export default function Mentor({
  isNotification,
  data: { ap, isUnlocked, title, description, unlockMessage },
  style
}: {
  isNotification?: boolean;
  data: {
    ap: number;
    isUnlocked: boolean;
    title: string;
    description: string;
    unlockMessage: string;
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemPanel
      isNotification={isNotification}
      style={style}
      ap={ap}
      isUnlocked={isUnlocked}
      itemName={title}
      description={description}
      unlockMessage={unlockMessage}
      requirement="Take a full-time teaching position at Twinkle Academy"
      badgeSrc={MentorBadge}
    />
  );
}
