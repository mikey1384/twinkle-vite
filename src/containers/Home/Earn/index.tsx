import React, { useRef } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import Leaderboards from './Leaderboards';
import ActivitySuggester from './ActivitySuggester';
import TopMenu from '../TopMenu';
import { useHomeContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';
import { useScrollAnchorRestoration } from '~/helpers/hooks/useScrollAnchorRestoration';

const leaderboardsLabel = 'Leaderboards';

export default function Earn() {
  const navigate = useNavigate();
  const earnListRef = useRef<HTMLDivElement | null>(null);
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
        <section data-scroll-anchor-id="home-earn:activity-suggester">
          <ActivitySuggester />
        </section>
        <section data-scroll-anchor-id="home-earn:leaderboards">
          <h2 style={{ fontSize: '2rem' }}>{leaderboardsLabel}</h2>
          <Leaderboards />
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
