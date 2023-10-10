import React from 'react';
import { Link } from 'react-router-dom';
import MissionBadge from '~/assets/mission.png';
import ItemPanel from './ItemPanel';
import { useKeyContext } from '~/contexts';

export default function Mission({
  isNotification,
  data: { id, ap, title, description, unlockMessage, milestones },
  style
}: {
  isNotification?: boolean;
  data: {
    id: number;
    ap: number;
    title: string;
    description: string;
    unlockMessage: string;
    milestones: { name: string; completed: boolean }[];
  };
  style?: React.CSSProperties;
}) {
  const { unlockedAchievementIds } = useKeyContext((v) => v.myState);
  return (
    <ItemPanel
      ap={ap}
      isUnlocked={unlockedAchievementIds.includes(id)}
      itemName={title}
      isNotification={isNotification}
      description={description}
      unlockMessage={unlockMessage}
      requirements={[
        <>
          Complete all{' '}
          <Link style={{ fontWeight: 'bold' }} to="/missions">
            missions
          </Link>
        </>
      ]}
      style={style}
      badgeSrc={MissionBadge}
      milestones={milestones}
    />
  );
}
