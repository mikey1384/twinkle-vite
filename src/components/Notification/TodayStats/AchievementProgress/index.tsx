import React, { useState, useEffect } from 'react';
import AchievementItem from './AchievementItem';
import { useAppContext, useKeyContext, useMissionContext } from '~/contexts';

const shownAchievements = ['mission', 'gold', 'grammar'];

export default function DailyGoals() {
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const [loadingMyAchievements, setLoadingMyAchievements] = useState(false);
  const loadMyAchievements = useAppContext(
    (v) => v.requestHelpers.loadMyAchievements
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const { userId } = useKeyContext((v) => v.myState);
  const [myAchievementsObj, setMyAchievementsObj] = useState<{
    [key: string]: {
      isUnlocked?: boolean;
      milestones?: { name: string; completed: boolean }[];
      progressObj?: {
        label: string;
        currentValue: number;
        targetValue: number;
      };
    };
  }>({});

  useEffect(() => {
    if (userId) init();
    async function init() {
      setLoadingMyAchievements(true);
      const data = await loadMyAchievements();
      const unlockedAchievementIds = [];
      for (const key in data) {
        if (data[key].isUnlocked) {
          unlockedAchievementIds.push(data[key].id);
        }
      }
      onSetUserState({ userId, newState: { unlockedAchievementIds } });
      setMyAchievementsObj(data);
      setLoadingMyAchievements(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, myAttempts]);

  return loadingMyAchievements ? null : (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', marginTop: '0.5rem' }}>
        {shownAchievements.map((key) => {
          const isUnlocked = myAchievementsObj[key]?.isUnlocked;
          const numCompletedMilestones = myAchievementsObj[
            key
          ]?.milestones?.filter((milestone) => milestone.completed).length;
          const numMilestones = myAchievementsObj[key]?.milestones?.length;
          return (
            <AchievementItem
              key={key}
              achievement={{
                ...achievementsObj[key],
                progressObj: myAchievementsObj[key]?.progressObj || {
                  currentValue: isUnlocked ? 1 : numCompletedMilestones,
                  targetValue: isUnlocked ? 1 : numMilestones
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
