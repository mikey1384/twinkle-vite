import React from 'react';
import FilterBar from '~/components/FilterBar';
import WinStreaks from './WinStreaks';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import DoubleStreaks from './DoubleStreak';

export default function Streaks({
  channelId,
  streaksTab,
  onSetStreaksTab,
  theme
}: {
  channelId: number;
  streaksTab: string;
  onSetStreaksTab: (tab: string) => void;
  theme: string;
}) {
  const myId = useKeyContext((v) => v.myState.userId);

  return (
    <div
      style={{
        height: 'CALC(100vh - 30rem)',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column'
      }}
    >
      <FilterBar
        style={{
          width: '100%',
          height: '4.5rem',
          fontSize: '1.6rem',
          marginBottom: 0
        }}
      >
        <nav
          className={streaksTab === 'win' ? 'active' : ''}
          onClick={() => onSetStreaksTab('win')}
        >
          Win Streaks
        </nav>
        <nav
          className={streaksTab === 'double' ? 'active' : ''}
          onClick={() => onSetStreaksTab('double')}
        >
          Double Bonus Streaks
        </nav>
      </FilterBar>
      <div
        style={{
          height: '100%',
          overflow: 'scroll',
          width: '100%',
          paddingTop: '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
        className={css`
          padding-left: 1rem;
          padding-right: 1rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding-left: 0;
            padding-right: 0;
          }
        `}
      >
        {streaksTab === 'win' ? (
          <WinStreaks channelId={channelId} myId={myId} theme={theme} />
        ) : (
          <DoubleStreaks channelId={channelId} myId={myId} theme={theme} />
        )}
        <div style={{ width: '100%', padding: '1rem' }} />
      </div>
    </div>
  );
}
