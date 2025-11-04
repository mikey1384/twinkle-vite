import React, { useEffect, useMemo, useState } from 'react';
import { Color } from '~/constants/css';
import AchievementItem from '~/components/AchievementItem';
import UserLevelStatus from './UserLevelStatus';
import Loading from '~/components/Loading';
import HomeLoginPrompt from '~/components/HomeLoginPrompt';
import { useAppContext, useMissionContext, useKeyContext } from '~/contexts';
import HomeSectionHeader from '~/components/HomeSectionHeader';

export default function Achievements() {
  const myAttempts = useMissionContext((v) => v.state.myAttempts);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [myAchievementsObj, setMyAchievementsObj] = useState<{
    [key: string]: {
      milestones?: { name: string; completed: boolean }[];
      progressObj?: {
        label: string;
        currentValue: number;
        targetValue: number;
      };
    };
  }>({});
  const userId = useKeyContext((v) => v.myState.userId);
  const isAchievementsLoaded = useKeyContext(
    (v) => v.myState.isAchievementsLoaded
  );
  const loadMyAchievements = useAppContext(
    (v) => v.requestHelpers.loadMyAchievements
  );
  const onSetIsAchievementsLoaded = useAppContext(
    (v) => v.user.actions.onSetIsAchievementsLoaded
  );
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const achievementKeys = useMemo(() => {
    const result = [];
    for (const key in achievementsObj) {
      result.push(key);
    }
    return result;
  }, [achievementsObj]);
  

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
          onSetUserState({ userId, newState: { unlockedAchievementIds } });
          onSetIsAchievementsLoaded(true);
          setMyAchievementsObj(data);
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

  return (
    <div style={{ paddingBottom: userId ? '15rem' : 0 }}>
      <HomeSectionHeader title="Achievements" style={{ marginBottom: '2rem' }} />
      {!userId ? (
        <HomeLoginPrompt />
      ) : !isAchievementsLoaded ? (
        <Loading />
      ) : (
        <>
          {userId && (
            <UserLevelStatus
              style={{
                marginBottom: '4rem',
                // Force neutral text colors (theme-independent)
                ['--home-panel-color' as any]: Color.darkerGray(),
                ['--home-panel-heading' as any]: Color.black(),
              }}
            />
          )}
          {achievementKeys.map((key) => (
            <AchievementItem
              key={key}
              achievement={{
                ...achievementsObj[key],
                milestones: myAchievementsObj[key]?.milestones,
                progressObj: myAchievementsObj[key]?.progressObj
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
