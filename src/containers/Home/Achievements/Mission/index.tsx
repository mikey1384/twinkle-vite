import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import MissionBadge from './mission.png';
import ItemPanel from '../ItemPanel';
import { useAppContext } from '~/contexts';

export default function Mission() {
  const loadAchievementMilestones = useAppContext(
    (v) => v.requestHelpers.loadAchievementMilestones
  );
  useEffect(() => {
    init();
    async function init() {
      await loadAchievementMilestones('mission');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      milestones={[
        { name: 'Complete Mission 1', completed: true },
        { name: 'Complete Mission 2', completed: true },
        { name: 'Complete Mission 3', completed: false },
        { name: 'Complete Mission 4', completed: false }
      ]}
    />
  );
}
