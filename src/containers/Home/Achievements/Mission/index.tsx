import React from 'react';
import { Link } from 'react-router-dom';
import MissionBadge from './mission.png';
import ItemPanel from '../ItemPanel';

export default function Mission({
  milestones
}: {
  milestones: { name: string; completed: boolean }[];
}) {
  return (
    <ItemPanel
      itemName="Mission Mastermind"
      description="Awarded to those who've shown exceptional determination and skill by
          completing all missions. Your dedication and persistence have truly
          made you a mastermind"
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
