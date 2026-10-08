import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { Color, mobileMaxWidth } from '~/constants/css';
import Button from '~/components/Button';
import AskAgentButton from '~/components/Buttons/AskAgentButton';
import AppCard from './AppCard';
import AppRow from './AppRow';
import TopPickCard from './TopPickCard';
import YourAppCard from './YourAppCard';
import RecentAppTile from './RecentAppTile';
import { useEarnHub } from './useEarnHub';
import { recommendationNote } from './appCardHelpers';
import ScopedTheme from '~/theme/ScopedTheme';
import { useHomePanelVars } from '~/theme/hooks/useHomePanelVars';
import { homePanelClass } from '~/theme/homePanels';
import { SITE_NAME } from '~/constants/siteBrand';

// Bounties: every approved app that pays real XP or Coins, with what this
// member has left in each today, and the builder's card after the grid. The
// server sends the apps already ranked by popularity (never re-sorted here)
// and this member's "Recommended for you" (Mikey 10-08: good apps they
// haven't tried, with why). Desktop: two big cards, the #1 this week and the
// recommendation, then #2-#30 as cards and the rest behind "See all" as
// ranked rows. Phones keep the stacked row shape: the recommendation first,
// then #1-#30, then "See all". Above all of it, "Jump back in": the member's
// recently used apps as small rows (Mikey 10-08), so regulars are one tap away. An older server without popularity gets the
// plain unranked shelf. Nothing shows until the server lists an approved app.
const DESKTOP_GRID_END = 30;
const PHONE_FIRST_ROWS = 30;

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
  const pick = hub?.recommendations?.[0];
  const recommended = pick
    ? apps.find((app) => app.buildId === pick.buildId)
    : undefined;
  const note = pick ? recommendationNote(pick.reason) : undefined;
  // "Jump back in": the member's regulars, one tap away (Mikey 10-08)
  const recent = (hub?.recentBuildIds || [])
    .map((buildId) => apps.find((app) => app.buildId === buildId))
    .filter((app): app is (typeof apps)[number] => !!app);
  return (
    <ErrorBoundary componentPath="Home/Earn/Bounties">
      <div className={headClass}>
        <div>
          <h2 className={titleClass}>Bounties</h2>
          <p className={subClass}>
            {ranked
              ? `Apps built on ${SITE_NAME} that pay real XP and Coins, most played first.`
              : `Apps built on ${SITE_NAME} that pay real XP and Coins. Approved by ${SITE_NAME}, paid by ${SITE_NAME}.`}
          </p>
        </div>
        <div className={headActionsClass}>
          <AskAgentButton
            label="Which one for me?"
            context={{ kind: 'page', label: 'Bounties', path: '/earn' }}
          />
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
      </div>
      <ScopedTheme
        theme={themeName}
        roles={['sectionPanel', 'sectionPanelText']}
        className={homePanelClass}
        style={panelVars}
      >
        {recent.length > 0 && (
          <section className={recentClass} aria-label="Jump back in">
            <h3 className={recentTitleClass}>Jump back in</h3>
            <ul className={recentListClass}>
              {recent.map((app) => (
                <RecentAppTile key={app.buildId} app={app} />
              ))}
            </ul>
          </section>
        )}
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
            {recommended && (
              <AppCard
                app={recommended}
                slot="recommended"
                eyebrow="Recommended for you"
                note={note}
              />
            )}
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
            {recommended ? (
              <div className={pairClass}>
                <TopPickCard app={apps[0]} />
                <TopPickCard app={recommended} recommended note={note} />
              </div>
            ) : (
              <TopPickCard app={apps[0]} />
            )}
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
const headActionsClass = css`
  display: flex;
  align-items: center;
  gap: 1.2rem;
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
const recentClass = css`
  margin-bottom: 1.4rem;
`;
const recentTitleClass = css`
  margin: 0 0 0.7rem;
  font-size: 1.5rem;
  font-weight: 800;
`;
const recentListClass = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.8rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
  }
`;
// the two big cards side by side; stacked when the panel is narrow
const pairClass = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.2rem;
  margin-bottom: 1.2rem;
  > article {
    margin-bottom: 0;
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
