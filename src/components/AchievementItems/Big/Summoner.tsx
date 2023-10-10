import React from 'react';
import SummonerBadge from '~/assets/summoner.png';
import ItemPanel from './ItemPanel';
import { useKeyContext } from '~/contexts';

export default function Summoner({
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
      requirements={['Unlock the AI Card Summoner License']}
      badgeSrc={SummonerBadge}
    />
  );
}
