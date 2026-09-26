import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { Color, mobileMaxWidth } from '~/constants/css';
import Button from '~/components/Button';
import AppCard from './AppCard';
import AppRow from './AppRow';
import TopPickCard from './TopPickCard';
import YourAppCard from './YourAppCard';
import { useEarnHub } from './useEarnHub';
import ScopedTheme from '~/theme/ScopedTheme';
import { useHomePanelVars } from '~/theme/hooks/useHomePanelVars';
import { homePanelClass } from '~/theme/homePanels';
import { SITE_NAME } from '~/constants/siteBrand';

// The App Store: every approved app that pays real XP or Coins, with what
// this member has left in each today, and the builder's card after the grid.
// The server sends the apps already ranked by popularity (never re-sorted
// here). Desktop shows the #1 as a wide top pick, #2-#7 as cards and the rest
// behind "See all" as ranked rows. Phones keep the stacked row shape: #1-#5,
// then "See all" for the rest. An older server without popularity gets the
// plain unranked shelf. Nothing shows until the server lists an approved app.
const DESKTOP_GRID_END = 7;
const PHONE_FIRST_ROWS = 5;

export default function Bounties({
  onOpenStandings
}: {
  onOpenStandings: () => void;
}) {
  const { hub, loading } = useEarnHub('week');
  const { panelVars, themeName } = useHomePanelVars(0.08, {
    neutralSurface: true
  });
  const isPhone = useIsPhone();
  const [showAll, setShowAll] = useState(false);
  if (!loading && !hub?.apps.length) return null;
  const apps = hub?.apps || [];
  const ranked = apps.some((app) => app.popularity);
  return (
    <ErrorBoundary componentPath="Home/Earn/Bounties">
      <div className={headClass}>
        <div>
          <h2 className={titleClass}>App Store</h2>
          <p className={subClass}>
            {ranked
              ? `Apps built on ${SITE_NAME} that pay real XP and Coins, most played first.`
              : `Apps built on ${SITE_NAME} that pay real XP and Coins. Approved by ${SITE_NAME}, paid by ${SITE_NAME}.`}
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
      <ScopedTheme
        theme={themeName}
        roles={['sectionPanel', 'sectionPanelText']}
        className={homePanelClass}
        style={panelVars}
      >
        {loading && !hub ? (
          <Loading style={{ height: '12rem' }} />
        ) : !ranked ? (
          <div className={shelfClass}>
            {apps.map((app) => (
              <AppCard key={app.buildId} app={app} />
            ))}
            <YourAppCard />
          </div>
        ) : isPhone ? (
          <div className={shelfClass}>
            {(showAll ? apps : apps.slice(0, PHONE_FIRST_ROWS)).map((app) => (
              <AppCard
                key={app.buildId}
                app={app}
                rank={app.popularity?.rank}
              />
            ))}
            {apps.length > PHONE_FIRST_ROWS && renderSeeAll()}
            <YourAppCard />
          </div>
        ) : (
          <>
            <TopPickCard app={apps[0]} />
            <div className={shelfClass}>
              {apps.slice(1, DESKTOP_GRID_END).map((app) => (
                <AppCard
                  key={app.buildId}
                  app={app}
                  rank={app.popularity?.rank}
                />
              ))}
              <YourAppCard />
            </div>
            {apps.length > DESKTOP_GRID_END && (
              <>
                {showAll && (
                  <ol className={rowsClass}>
                    {apps.slice(DESKTOP_GRID_END).map((app) => (
                      <AppRow key={app.buildId} app={app} />
                    ))}
                  </ol>
                )}
                {renderSeeAll()}
              </>
            )}
          </>
        )}
      </ScopedTheme>
    </ErrorBoundary>
  );

  function renderSeeAll() {
    return (
      <div className={seeAllClass}>
        <Button
          color="logoBlue"
          variant="outline"
          shape="pill"
          size="md"
          stretch={isPhone}
          aria-expanded={showAll}
          onClick={() => setShowAll((shown) => !shown)}
        >
          {showAll ? 'Show fewer apps' : `See all apps (${apps.length})`}
        </Button>
      </div>
    );
  }
}

function useIsPhone() {
  const query = `(max-width: ${mobileMaxWidth})`;
  const [isPhone, setIsPhone] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(query).matches
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(query);
    const update = () => setIsPhone(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);
  return isPhone;
}

const headClass = css`
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
const titleClass = css`
  margin: 0;
  font-size: 2rem;
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
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;
const rowsClass = css`
  list-style: none;
  margin: 1.2rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.8rem;
`;
const seeAllClass = css`
  display: flex;
  justify-content: center;
  margin-top: 1.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    margin-top: 0;
  }
`;
