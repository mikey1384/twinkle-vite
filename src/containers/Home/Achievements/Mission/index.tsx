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
      description="This esteemed title is bestowed upon those who've showcased extraordinary dedication and skill by conquering all missions. Your unwavering commitment and tenacity have propelled you to master every challenge that came your way. This badge is a testament to your prowess and a symbol of your mastery in the realm of missions."
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
