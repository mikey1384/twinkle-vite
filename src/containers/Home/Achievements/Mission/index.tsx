import React from 'react';
import { Link } from 'react-router-dom';
import MissionBadge from './mission.png';
import ItemPanel from '../ItemPanel';

export default function Mission({
  data: { title, description, isUnlocked, milestones }
}: {
  data: {
    isUnlocked: boolean;
    title: string;
    description: string;
    milestones: { name: string; completed: boolean }[];
  };
}) {
  return (
    <ItemPanel
      itemName={title}
      isUnlocked={isUnlocked}
      description={description}
      requirements={[
        <>
          Complete all{' '}
          <Link style={{ fontWeight: 'bold' }} to="/missions">
            missions
          </Link>
        </>
      ]}
      badgeSrc={MissionBadge}
      milestones={milestones}
    />
  );
}
