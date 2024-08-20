import React from 'react';
import FounderBadge from '~/assets/founder.png';
import ItemPanel from './ItemPanel';
import { useKeyContext } from '~/contexts';

export default function Founder({
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
    isUnlocked: boolean;
    title: string;
    description: string;
    unlockMessage: string;
  };
  style?: React.CSSProperties;
}) {
  const { unlockedAchievementIds } = useKeyContext((v) => v.myState);
  return (
    <ItemPanel
      itemId={id}
      isThumb={isThumb}
      isNotification={isNotification}
      style={style}
      ap={ap}
      isUnlocked={unlockedAchievementIds.includes(id)}
      itemName={title}
      description={description}
      unlockMessage={unlockMessage}
      requirements={['Found a new business']}
      badgeSrc={FounderBadge}
    />
  );
}
