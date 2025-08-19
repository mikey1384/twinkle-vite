import React from 'react';
import ItemPanel from './ItemPanel';
import ChessLegendBadge from '~/assets/chess-legend.png';
import { useKeyContext } from '~/contexts';

export default function ChessLegend({
  isThumb,
  isNotification,
  data: { id, ap, title, description, unlockMessage, milestones, progressObj },
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
  };
  style?: React.CSSProperties;
}) {
  const unlockedAchievementIds = useKeyContext(
    (v) => v.myState.unlockedAchievementIds
  );

  const filteredProgress =
    progressObj && progressObj.currentValue > 0 ? progressObj : undefined;

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
      requirements={['Solve 1,000 Legendary+ chess puzzles']}
      milestones={milestones}
      progressObj={filteredProgress}
      badgeSrc={ChessLegendBadge}
    />
  );
}
