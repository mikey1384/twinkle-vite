import React, { useEffect } from 'react';
import AchievementItem from './AchievementItem';
import { useAppContext, useKeyContext, useMissionContext } from '~/contexts';

const shownAchievements = ['mission', 'gold', 'grammar'];

export default function AchievementProgress({
  myAchievementsObj,
  onSetMyAchievementsObj
}: {
  myAchievementsObj: {
    [key: string]: {
      isUnlocked?: boolean;
      milestones?: { name: string; completed: boolean }[];
      progressObj?: {
        label: string;
        currentValue: number;
        targetValue: number;
      };
    };
  };
  onSetMyAchievementsObj: (myAchievementsObj: any) => void;
}) {
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const loadMyAchievements = useAppContext(
    (v) => v.requestHelpers.loadMyAchievements
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onSetIsAchievementsLoaded = useAppContext(
    (v) => v.user.actions.onSetIsAchievementsLoaded
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const isAchievementsLoaded = useKeyContext(
    (v) => v.myState.isAchievementsLoaded
  );

  useEffect(() => {
    if (userId) init();
    async function init() {
      const maxRetries = 3;
      const cooldown = 1000;
      let attempt = 0;
      let data;

      while (attempt < maxRetries) {
        try {
          data = await loadMyAchievements();
          const unlockedAchievementIds = [];
          for (const key in data) {
            if (data[key].isUnlocked) {
              unlockedAchievementIds.push(data[key].id);
            }
          }
          onSetUserState({
            userId,
            newState: { unlockedAchievementIds }
          });
          onSetIsAchievementsLoaded(true);
          onSetMyAchievementsObj(data);
          break;
        } catch (error) {
          console.error(`Attempt ${attempt + 1} failed:`, error);
          attempt++;
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, cooldown));
          }
        } finally {
          if (attempt >= maxRetries) {
            console.error('All retry attempts failed.');
            onSetIsAchievementsLoaded(false);
          }
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, myAttempts]);

  return isAchievementsLoaded ? (
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
              isUnlocked={isUnlocked}
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
  ) : null;
}
