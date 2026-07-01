import React from 'react';
import ItemPanel, { AchievementPhase } from './ItemPanel';
import ChessLegendBadge from '~/assets/chess-legend.png';
import { useKeyContext } from '~/contexts';

export default function ChessLegend({
  isThumb,
  isNotification,
  data: {
    id,
    ap,
    title,
    description,
    unlockMessage,
    milestones,
    progressObj,
    phases
  },
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
    milestones?: { name: string; completed: boolean }[];
    progressObj?: { label: string; currentValue: number; targetValue: number };
    phases?: AchievementPhase[];
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
      requirements={[
        'Reach level 31+',
        'Solve 100 Legendary+ chess puzzles'
      ]}
      milestones={milestones}
      progressObj={progressObj}
      phases={phases}
      badgeSrc={ChessLegendBadge}
    />
  );
}
