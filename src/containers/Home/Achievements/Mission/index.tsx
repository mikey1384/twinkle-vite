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
      itemName="Mission Master"
      description="This achievement celebrates those who've demonstrated exceptional grit and adaptability, conquering a diverse array of challenges. You've navigated through various missions, each requiring unique skills and strategies. Your successful completion of these tasks is a testament to your resilience and determination, rightfully earning you the title of Mission Master."
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
