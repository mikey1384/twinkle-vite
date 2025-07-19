import React from 'react';
import GrammarBadge from '~/assets/grammar.png';
import ItemPanel from './ItemPanel';
import { useKeyContext } from '~/contexts';

export default function Grammar({
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
      requirements={['Earn 100,000 Twinkle Coins playing Grammarbles']}
      progressObj={progressObj}
      badgeSrc={GrammarBadge}
    />
  );
}
