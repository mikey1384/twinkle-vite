import React, { useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import Leaderboards from './Leaderboards';
import RewardBoards from './Leaderboards/RewardBoards';
import Bounties from './Bounties';
import ActivitySuggester from './ActivitySuggester';
import TopMenu from '../TopMenu';
import { useHomeContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { useScrollAnchorRestoration } from '~/helpers/hooks/useScrollAnchorRestoration';

const leaderboardsLabel = 'Leaderboards';
const BOARD_TABS: Array<['members' | 'apps' | 'creators', string]> = [
  ['members', 'Members'],
  ['apps', 'Apps'],
  ['creators', 'Creators']
];

export default function Earn() {
  const navigate = useNavigate();
  const earnListRef = useRef<HTMLDivElement | null>(null);
  const [boardTab, setBoardTab] = useState<'members' | 'apps' | 'creators'>('members');
  const onSetAIStoriesModalShown = useHomeContext(
    (v) => v.actions.onSetAIStoriesModalShown
  );
  const onSetGrammarGameModalShown = useHomeContext(
    (v) => v.actions.onSetGrammarGameModalShown
  );
  const onSetDailyQuestionModalShown = useHomeContext(
    (v) => v.actions.onSetDailyQuestionModalShown
  );
  const onSetInputModalShown = useHomeContext(
    (v) => v.actions.onSetInputModalShown
  );

  useScrollAnchorRestoration({
    anchorKey: 'home:earn',
    containerRef: earnListRef,
    initialScroll: { type: 'top' },
    itemsReady: true
  });

  return (
    <ErrorBoundary componentPath="Home/Earn/index">
      <TopMenu
        showDailyRewardBoostStrip={false}
        style={{ marginBottom: '3.5rem' }}
        onPlayAIStories={() => onSetAIStoriesModalShown(true)}
        onPlayGrammarGame={() => onSetGrammarGameModalShown(true)}
        onDailyQuestionClick={() => onSetDailyQuestionModalShown(true)}
        onInputModalButtonClick={handleInputModalButtonClick}
      />
      <div
        ref={earnListRef}
        className={css`
          > section {
            margin-bottom: 3rem;
            > h2 {
              margin-bottom: 1.3rem;
            }
          }
          @media (max-width: ${mobileMaxWidth}) {
            margin-top: 1rem;
            > section {
              padding-bottom: 2rem;
              > h2 {
                padding-left: 1rem;
              }
            }
          }
        `}
      >
        <section data-scroll-anchor-id="home-earn:bounties">
          <Bounties
            onOpenStandings={() => {
              setBoardTab('apps');
              document
                .getElementById('earn-leaderboards')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        </section>
        <section data-scroll-anchor-id="home-earn:activity-suggester">
          <ActivitySuggester />
        </section>
        <section
          id="earn-leaderboards"
          data-scroll-anchor-id="home-earn:leaderboards"
        >
          <div className={boardHeadClass}>
            <h2 style={{ fontSize: '2rem', margin: 0 }}>{leaderboardsLabel}</h2>
            <div className={boardTabsClass} role="tablist" aria-label="Leaderboard">
              {BOARD_TABS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={boardTab === key}
                  className={`${boardTabClass} ${boardTab === key ? 'on' : ''}`}
                  onClick={() => setBoardTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {boardTab === 'members' ? (
            <Leaderboards />
          ) : (
            <RewardBoards kind={boardTab} />
          )}
        </section>
        <div style={{ height: '15rem' }} />
      </div>
    </ErrorBoundary>
  );

  function handleInputModalButtonClick(modalType?: string) {
    navigate('/');
    onSetInputModalShown({ shown: true, modalType });
  }
}

const boardHeadClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.3rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 1rem;
  }
`;
const boardTabsClass = css`
  display: flex;
  gap: 0.4rem;
  background: rgba(15, 23, 42, 0.06);
  border-radius: 999px;
  padding: 0.3rem;
`;
const boardTabClass = css`
  border: 0;
  background: transparent;
  border-radius: 999px;
  padding: 0.7rem 1.4rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.6);
  cursor: pointer;
  &.on {
    background: #fff;
    color: ${Color.logoBlue()};
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }
  &:focus-visible {
    outline: 2px solid ${Color.logoBlue()};
    outline-offset: 2px;
  }
`;
