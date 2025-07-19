import React from 'react';
import GoldBadge from '~/assets/gold.png';
import ItemPanel from './ItemPanel';
import { useKeyContext } from '~/contexts';

export default function Gold({
  isThumb,
  isNotification,
  data: { id, ap, title, description, progressObj, unlockMessage },
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
    progressObj: { label: string; currentValue: number; targetValue: number };
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
      requirements={['Earn 10,000,000 XP']}
      progressObj={progressObj}
      badgeSrc={GoldBadge}
    />
  );
}
