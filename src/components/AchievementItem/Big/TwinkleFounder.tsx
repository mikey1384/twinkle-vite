import React from 'react';
import FounderBadge from '~/assets/founder.png';
import ItemPanel from './ItemPanel';
import { useKeyContext } from '~/contexts';

export default function TwinkleFounder({
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
      isThumb={isThumb}
      isNotification={isNotification}
      itemId={id}
      style={style}
      ap={ap}
      isUnlocked={unlockedAchievementIds.includes(id)}
      itemName={title}
      description={description}
      unlockMessage={unlockMessage}
      requirements={['Found Twinkle English Academy']}
      badgeSrc={FounderBadge}
    />
  );
}
