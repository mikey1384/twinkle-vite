import React from 'react';
import MentorBadge from '~/assets/mentor.png';
import ItemPanel from './ItemPanel';
import { useKeyContext } from '~/contexts';

export default function Mentor({
  isNotification,
  data: { id, ap, title, description, unlockMessage },
  style
}: {
  isNotification?: boolean;
  data: {
    id: number;
    ap: number;
    title: string;
    description: string;
    unlockMessage: string;
  };
  style?: React.CSSProperties;
}) {
  const { unlockedAchievementIds } = useKeyContext((v) => v.myState);
  return (
    <ItemPanel
      isUnlocked={unlockedAchievementIds.includes(id)}
      isNotification={isNotification}
      style={style}
      ap={ap}
      itemName={title}
      description={description}
      unlockMessage={unlockMessage}
      requirements={['Take a full-time teaching position at Twinkle Academy']}
      badgeSrc={MentorBadge}
    />
  );
}
