import React from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { Color, mobileMaxWidth } from '~/constants/css';
import AppCard from './AppCard';
import YourAppCard from './YourAppCard';
import { useEarnHub } from './useEarnHub';

// The Bounties shelf: every approved app that pays real XP or Coins, with
// what this member has left in each today, and the builder's card at the
// end. Nothing shows until the server lists at least one approved app.
export default function Bounties({
  onOpenStandings
}: {
  onOpenStandings: () => void;
}) {
  const { hub, loading } = useEarnHub('week');
  if (!loading && !hub?.apps.length) return null;
  return (
    <ErrorBoundary componentPath="Home/Earn/Bounties">
      <div className={headClass}>
        <div>
          <h2 className={titleClass}>Bounties</h2>
          <p className={subClass}>
            Apps built on Twinkle that pay real XP and Coins. Approved by
            Twinkle, paid by Twinkle.
          </p>
        </div>
        <a
          className={linkClass}
          href="#earn-leaderboards"
          onClick={(event) => {
            event.preventDefault();
            onOpenStandings();
          }}
        >
          Standings →
        </a>
      </div>
      {loading && !hub ? (
        <Loading style={{ height: '12rem' }} />
      ) : (
        <div className={shelfClass}>
          {hub!.apps.map((app) => (
            <AppCard key={app.buildId} app={app} />
          ))}
          <YourAppCard />
        </div>
      )}
    </ErrorBoundary>
  );
}

const headClass = css`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.2rem;
  margin-bottom: 1.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 1rem;
  }
`;
const titleClass = css`
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--home-panel-heading, ${Color.darkerGray()});
`;
const subClass = css`
  margin: 0.2rem 0 0;
  font-size: 1.3rem;
  color: rgba(15, 23, 42, 0.66);
`;
const linkClass = css`
  color: ${Color.logoBlue()};
  font-weight: 700;
  font-size: 1.4rem;
  white-space: nowrap;
  text-decoration: none;
`;
const shelfClass = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 1rem;
    padding: 0 1rem 0.6rem;
    -webkit-overflow-scrolling: touch;
    > * {
      flex: 0 0 78%;
      scroll-snap-align: start;
    }
  }
`;
