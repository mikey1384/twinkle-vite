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
      className={css`
        height: calc(100vh - 30rem);
        width: 100%;
        display: flex;
        align-items: center;
        flex-direction: column;
      `}
    >
      <FilterBar
        className={css`
          > .nav-section > nav {
            padding: 0;
            min-width: 0;
          }
          > .nav-section > nav > button {
            appearance: none;
            border: 0;
            background: transparent;
            color: inherit;
            font: inherit;
            font-size: 16px;
            line-height: 1.4;
            width: 100%;
            min-height: 44px;
            padding: 8px;
            white-space: normal;
            cursor: pointer;
          }
          > .nav-section > nav > button:focus-visible {
            outline: 2px solid currentColor;
            outline-offset: -3px;
            border-radius: 4px;
          }
        `}
        style={{
          width: '100%',
          height: '4.5rem',
          fontSize: '1.6rem',
          marginBottom: 0
        }}
      >
        <nav className={streaksTab === 'win' ? 'active' : ''}>
          <button
            type="button"
            aria-pressed={streaksTab === 'win'}
            onClick={() => onSetStreaksTab('win')}
          >
            Win Streaks
          </button>
        </nav>
        <nav className={streaksTab === 'double' ? 'active' : ''}>
          <button
            type="button"
            aria-pressed={streaksTab === 'double'}
            onClick={() => onSetStreaksTab('double')}
          >
            Double Bonus Streaks
          </button>
        </nav>
      </FilterBar>
      <div
        style={{
          height: '100%',
          overflow: 'hidden',
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
