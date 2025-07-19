import React from 'react';
import MentorBadge from '~/assets/mentor.png';
import ItemPanel from './ItemPanel';
import { useKeyContext } from '~/contexts';

export default function Mentor({
  isThumb,
  isNotification,
  data: { id, ap, title, description, unlockMessage },
  style
}: {
  isThumb?: boolean;
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
  const unlockedAchievementIds = useKeyContext(
    (v) => v.myState.unlockedAchievementIds
  );
  return (
    <ItemPanel
      isUnlocked={unlockedAchievementIds.includes(id)}
      isThumb={isThumb}
      isNotification={isNotification}
      itemId={id}
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
