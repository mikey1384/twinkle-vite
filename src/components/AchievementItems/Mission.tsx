import React from 'react';
import { Link } from 'react-router-dom';
import MissionBadge from '~/assets/mission.png';
import ItemPanel from './ItemPanel';

export default function Mission({
  data: { ap, title, description, isUnlocked, milestones },
  style
}: {
  data: {
    ap: number;
    isUnlocked: boolean;
    title: string;
    description: string;
    milestones: { name: string; completed: boolean }[];
  };
  style?: React.CSSProperties;
}) {
  return (
    <ItemPanel
      ap={ap}
      itemName={title}
      isUnlocked={isUnlocked}
      description={description}
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
