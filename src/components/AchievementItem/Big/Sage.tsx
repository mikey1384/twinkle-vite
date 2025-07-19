import React from 'react';
import SageBadge from '~/assets/sage.png';
import ItemPanel from './ItemPanel';
import { useKeyContext } from '~/contexts';

export default function Sage({
  isNotification,
  isThumb,
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
      isUnlocked={unlockedAchievementIds.includes(id)}
      isNotification={isNotification}
      itemId={id}
      style={style}
      ap={ap}
      itemName={title}
      description={description}
      unlockMessage={unlockMessage}
      requirements={['Rise to the rank of Head Teacher at Twinkle Academy']}
      badgeSrc={SageBadge}
    />
  );
}
