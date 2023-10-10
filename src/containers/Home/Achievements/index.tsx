import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import Adult from '~/components/AchievementItems/Big/Adult';
import Mission from '~/components/AchievementItems/Big/Mission';
import Summoner from '~/components/AchievementItems/Big/Summoner';
import Grammar from '~/components/AchievementItems/Big/Grammar';
import Mentor from '~/components/AchievementItems/Big/Mentor';
import Teenager from '~/components/AchievementItems/Big/Teenager';
import Sage from '~/components/AchievementItems/Big/Sage';
import TwinkleFounder from '~/components/AchievementItems/Big/TwinkleFounder';
import UserLevelStatus from './UserLevelStatus';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';

export default function Achievements() {
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
      setMyAchievementsObj(data);
      setLoadingMyAchievements(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
          {achievementKeys.map((key, index) => {
            const Component = {
              adult: Adult,
              mission: Mission,
              summoner: Summoner,
              grammar: Grammar,
              teenager: Teenager,
              mentor: Mentor,
              sage: Sage,
              twinkle_founder: TwinkleFounder
            }[key];

            return (
              Component && (
                <Component
                  key={key}
                  data={{
                    ...achievementsObj[key],
                    milestones: myAchievementsObj[key]?.milestones,
                    progressObj: myAchievementsObj[key]?.progressObj
                  }}
                  style={{ marginTop: index > 0 ? '1rem' : 0 }}
                />
              )
            );
          })}
        </>
      )}
    </div>
  );
}
