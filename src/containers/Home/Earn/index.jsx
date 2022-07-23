import ErrorBoundary from '~/components/ErrorBoundary';
import HighXPSubjects from './HighXPSubjects';
import localize from '~/constants/localize';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import Leaderboard from './Leaderboard';

const earnXPLabel = localize('earnXP');
const leaderboardsLabel = localize('leaderboards');

export default function Earn() {
  return (
    <ErrorBoundary componentPath="Home/Earn/index">
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
          <h2>{earnXPLabel}</h2>
          <HighXPSubjects />
        </section>
        <section>
          <h2>{leaderboardsLabel}</h2>
          <Leaderboard />
        </section>
        <div style={{ height: '15rem' }} />
      </div>
    </ErrorBoundary>
  );
}
