import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import AchievementItem from '~/components/AchievementItem';
import UserLevelStatus from './UserLevelStatus';
import Loading from '~/components/Loading';
import { useAppContext, useMissionContext, useKeyContext } from '~/contexts';

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
  const [loadingMyAchievements, setLoadingMyAchievements] = useState(false);
  const { userId } = useKeyContext((v) => v.myState);
  const loadMyAchievements = useAppContext(
    (v) => v.requestHelpers.loadMyAchievements
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

  return (
    <div style={{ paddingBottom: userId ? '15rem' : 0 }}>
      <div
        className={css`
          margin-bottom: 2rem;
          background: #fff;
          padding: 1rem;
          border: 1px solid ${Color.borderGray()};
          border-radius: ${borderRadius};
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
            border-top: 0;
            border-left: 0;
            border-right: 0;
          }
        `}
      >
        <p
          className={css`
            font-size: 2rem;
            font-weight: bold;
            line-height: 1.5;
          `}
          style={{ fontWeight: 'bold', fontSize: '2.5rem' }}
        >
          Achievements
        </p>
      </div>

      {!userId ? (
        <div
          className={css`
            text-align: center;
            font-size: 2.3rem;
            font-weight: bold;
            color: ${Color.black()};
            margin-top: 17vh;
          `}
        >
          Please log in to view this page
        </div>
      ) : !achievementKeys.length || loadingMyAchievements ? (
        <Loading />
      ) : (
        <>
          {userId && (
            <UserLevelStatus
              style={{
                marginBottom: '4rem'
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
