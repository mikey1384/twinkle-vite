import React, { useEffect } from 'react';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import Mission from './Mission';
import Summoner from './Summoner';
import Mentor from './Mentor';
import Sage from './Sage';
import Founder from './Founder';
import { useAppContext } from '~/contexts';

export default function Achievements() {
  const loadAchievements = useAppContext(
    (v) => v.requestHelpers.loadAchievements
  );
  useEffect(() => {
    init();
    async function init() {
      await loadAchievements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <Mission />
      <Summoner style={{ marginTop: '1rem' }} />
      <Mentor style={{ marginTop: '1rem' }} />
      <Sage style={{ marginTop: '1rem' }} />
      <Founder style={{ marginTop: '1rem' }} />
    </div>
  );
}
