import React, { useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import TopRanker from './TopRanker';
import Top30Modal from './Top30Modal';
import { themedCardBase } from '~/theme/themedCard';

const container = css`
  ${themedCardBase};
  padding: 1.5rem 1.8rem;
`;

export default function MonthItem({
  monthLabel,
  yearLabel,
  style,
  top30
}: {
  monthLabel: string;
  yearLabel: string;
  style?: React.CSSProperties;
  top30: any[];
}) {
  const [top30ModalShown, setTop30ModalShown] = useState(false);
  const top3 = useMemo(() => {
    return top30?.slice(0, 3);
  }, [top30]);

  return (
    <div
      className={container}
      style={
        {
          ['--themed-card-bg' as const]: 'var(--earn-panel-bg, #f8f9ff)',
          ...(style || {})
        } as React.CSSProperties
      }
    >
      <p
        className={css`
          font-size: 2rem;
          font-weight: bold;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.7rem;
          }
        `}
      >
        {monthLabel}
      </p>
      <div
        style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}
      >
        {top3?.length > 0 ? (
          <>
            {top3.map((user, index) => (
              <TopRanker
                key={user.id}
                style={{ marginLeft: index === 0 ? 0 : '1rem' }}
                username={user.username}
                profilePicUrl={user.profilePicUrl}
                userId={user.id}
                rank={Number(user.rank)}
              />
            ))}
          </>
        ) : (
          <div
            style={{
              paddingTop: '1rem',
              paddingBottom: '3rem',
              fontWeight: 'bold'
            }}
          >
            {`Be the first to join this month's leaderboard by earning XP`}
          </div>
        )}
      </div>
      <div style={{ height: '1rem' }} />
      {top3?.length === 3 && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <a
            style={{ fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => setTop30ModalShown(true)}
          >
            Show Top 30
          </a>
        </div>
      )}
      {top30ModalShown && (
        <Top30Modal
          month={monthLabel}
          year={yearLabel}
          users={top30}
          onHide={() => setTop30ModalShown(false)}
        />
      )}
    </div>
  );
}
