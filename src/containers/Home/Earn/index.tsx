import React from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import localize from '~/constants/localize';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import Leaderboards from './Leaderboards';
import ActivitySuggester from './ActivitySuggester';
import TopMenu from '../TopMenu';
import { useHomeContext, useKeyContext } from '~/contexts';
import { useNavigate } from 'react-router-dom';

const leaderboardsLabel = localize('leaderboards');

export default function Earn() {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const onSetAIStoriesModalShown = useHomeContext(
    (v) => v.actions.onSetAIStoriesModalShown
  );
  const onSetGrammarGameModalShown = useHomeContext(
    (v) => v.actions.onSetGrammarGameModalShown
  );
  const onSetInputModalShown = useHomeContext(
    (v) => v.actions.onSetInputModalShown
  );

  return (
    <ErrorBoundary componentPath="Home/Earn/index">
      {userId && (
        <TopMenu
          style={{ marginBottom: '3.5rem' }}
          onPlayAIStories={() => onSetAIStoriesModalShown(true)}
          onPlayGrammarGame={() => onSetGrammarGameModalShown(true)}
          onInputModalButtonClick={handleInputModalButtonClick}
        />
      )}
      <div
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
        <section>
          <ActivitySuggester />
        </section>
        <section>
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
