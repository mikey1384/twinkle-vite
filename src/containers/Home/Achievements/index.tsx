import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import Adult from '~/components/AchievementItems/Adult';
import Mission from '~/components/AchievementItems/Mission';
import Summoner from '~/components/AchievementItems/Summoner';
import Grammar from '~/components/AchievementItems/Grammar';
import Mentor from '~/components/AchievementItems/Mentor';
import Teenager from '~/components/AchievementItems/Teenager';
import Sage from '~/components/AchievementItems/Sage';
import Founder from '~/components/AchievementItems/Founder';
import UserLevelStatus from './UserLevelStatus';
import { useAppContext, useKeyContext } from '~/contexts';

export default function Achievements() {
  const { userId } = useKeyContext((v) => v.myState);
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const achievementKeys = useMemo(() => {
    const result = [];
    for (const key in achievementsObj) {
      result.push(key);
    }
    return result;
  }, [achievementsObj]);

  return (
    <div style={{ paddingBottom: '15rem' }}>
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
          founder: Founder
        }[key];

        return (
          Component && (
            <Component
              key={key}
              data={achievementsObj[key]}
              style={{ marginTop: index > 0 ? '1rem' : 0 }}
            />
          )
        );
      })}
    </div>
  );
}
