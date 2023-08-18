import React from 'react';
import { Link } from 'react-router-dom';
import MissionBadge from '~/assets/mission.png';
import ItemPanel from './ItemPanel';

export default function Mission({
  isNotification,
  data: { ap, title, description, unlockMessage, isUnlocked, milestones },
  style
}: {
  isNotification?: boolean;
  data: {
    ap: number;
    isUnlocked: boolean;
    title: string;
    description: string;
    unlockMessage: string;
    milestones: { name: string; completed: boolean }[];
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemPanel
      ap={ap}
      itemName={title}
      isNotification={isNotification}
      isUnlocked={isUnlocked}
      description={description}
      unlockMessage={unlockMessage}
      requirement={
        <>
          Complete all{' '}
          <Link style={{ fontWeight: 'bold' }} to="/missions">
            missions
          </Link>
        </>
      }
      style={style}
      badgeSrc={MissionBadge}
      milestones={milestones}
    />
  );
}
