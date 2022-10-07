import ErrorBoundary from '~/components/ErrorBoundary';
import localize from '~/constants/localize';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import Leaderboards from './Leaderboards';
import ActivitySuggester from './ActivitySuggester';
import TopMenu from '../TopMenu';

const leaderboardsLabel = localize('leaderboards');

export default function Earn() {
  return (
    <ErrorBoundary componentPath="Home/Earn/index">
      <TopMenu />
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
          <h2>Earn Karma Points</h2>
          <ActivitySuggester />
        </section>
        <section>
          <h2>{leaderboardsLabel}</h2>
          <Leaderboards />
        </section>
        <div style={{ height: '15rem' }} />
      </div>
    </ErrorBoundary>
  );
}
