import React, { useEffect, useState } from 'react';
import { css, cx } from '@emotion/css';
import Button from '~/components/Button';
import FavoriteButton from '~/components/Build/FavoriteButton';
import Link from '~/components/Link';
import { Color, borderRadius } from '~/constants/css';
import { SITE_NAME } from '~/constants/siteBrand';
import type { EarnHubApp } from './useEarnHub';
import {
  getAppPayout,
  getAppStatus,
  getAppSubtitle,
  getPlayersLine,
  newBadgeClass,
  appTitleRowClass,
  appTitleTextClass
} from './appCardHelpers';
import { useBountySeen, useOpenBountyApp } from './bountyTracking';
import { AppAskButton, AppRewardsButton } from './AppRewardsModal';

// The big card on desktop: the #1 this week, and (Mikey 10-08) the member's
// "Recommended for you" with why beside it. The same facts as a shelf card
// with a bigger picture. Phones never render this (they keep rows).
export default function TopPickCard({
  app,
  recommended = false,
  note
}: {
  app: EarnHubApp;
  recommended?: boolean;
  note?: string;
}) {
  const slot = recommended ? 'recommended' : 'top';
  const openApp = useOpenBountyApp();
  const seenRef = useBountySeen(app, slot);
  const [favorited, setFavorited] = useState(Boolean(app.isFavorited));
  useEffect(() => {
    setFavorited(Boolean(app.isFavorited));
  }, [app.isFavorited]);
  const payout = getAppPayout(app);
  const status = getAppStatus(app);
  const playersLine = getPlayersLine(app);
  return (
    <article
      className={cx(cardClass, recommended && recommendedClass)}
      ref={seenRef as React.Ref<HTMLElement>}
    >
      <div
        className={thumbClass}
        style={
          app.thumbnailUrl
            ? { backgroundImage: `url(${app.thumbnailUrl})` }
            : undefined
        }
        aria-hidden
      >
        {!app.thumbnailUrl && (
          <span className={monogramClass}>{app.title.slice(0, 1)}</span>
        )}
        <span className={eyebrowClass}>
          {recommended ? (
            <span className={forYouClass}>For you</span>
          ) : (
            <span className={rankClass}>#{app.popularity?.rank || 1}</span>
          )}
          {recommended ? 'Recommended for you' : 'Top pick this week'}
        </span>
      </div>
      <div className={bodyClass}>
        <h3 className={cx(titleClass, appTitleRowClass)}>
          <span className={appTitleTextClass}>{app.title}</span>
          {app.popularity?.isNew && <span className={newBadgeClass}>New</span>}
        </h3>
        <div className={byClass}>
          by{' '}
          {app.ownerUsername ? (
            <Link
              to={`/users/${app.ownerUsername}`}
              style={{ fontWeight: 700 }}
            >
              {app.ownerUsername}
            </Link>
          ) : (
            <b>a {SITE_NAME} member</b>
          )}{' '}
          · {getAppSubtitle(app)}
        </div>
        {note && <div className={noteClass}>{note}</div>}
        <div className={pillRowClass}>
          <span className={payPillClass}>{payout}</span>
          {playersLine && <span className={playersClass}>{playersLine}</span>}
        </div>
        <div className={statusClass}>{status.line}</div>
        <div className={barClass} role="img" aria-label={status.line}>
          <i style={{ width: `${Math.round(status.ratio * 100)}%` }} />
        </div>
        <AppRewardsButton app={app} slot={slot} />
        <div className={actionsClass}>
          <Button
            color="logoBlue"
            variant="solid"
            tone="flat"
            shape="pill"
            size="lg"
            stretch
            onClick={() => openApp(app, slot)}
          >
            Play
          </Button>
          <AppAskButton app={app} />
          <FavoriteButton
            buildId={app.buildId}
            className={favoriteClass}
            favorited={favorited}
            title={app.title}
            onChange={(change) => setFavorited(change.isFavorited)}
          />
        </div>
      </div>
    </article>
  );
}

const cardClass = css`
  display: flex;
  flex-direction: column;
  border-radius: ${borderRadius};
  border: 1px solid var(--home-panel-card-border, rgba(148, 163, 184, 0.35));
  background: rgba(255, 255, 255, 0.94);
  overflow: hidden;
  margin-bottom: 1.2rem;
`;
const recommendedClass = css`
  border: 2px solid ${Color.logoBlue(0.55)};
`;
const forYouClass = css`
  flex-shrink: 0;
  white-space: nowrap;
  padding: 0.1rem 0.7rem;
  border-radius: 999px;
  background: ${Color.logoBlue()};
  color: #fff;
  letter-spacing: 0;
`;
const noteClass = css`
  font-size: 1.4rem;
  font-weight: 700;
  color: ${Color.logoBlue()};
`;
const thumbClass = css`
  position: relative;
  aspect-ratio: 2 / 1;
  background: #101828 center / cover no-repeat;
  display: grid;
  place-items: center;
`;
const monogramClass = css`
  font-size: 7rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
`;
const bodyClass = css`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.9rem;
  padding: 1.6rem 1.8rem 1.8rem;
  min-width: 0;
`;
const eyebrowClass = css`
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.3rem 1rem 0.3rem 0.3rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.82);
  color: #fff;
  font-size: 1.25rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;
const rankClass = css`
  padding: 0.1rem 0.7rem;
  border-radius: 999px;
  background: ${Color.gold(0.95)};
  color: #5a3d05;
  letter-spacing: 0;
`;
const titleClass = css`
  margin: 0;
  font-size: 2.6rem;
  line-height: 1.2;
  font-weight: 800;
  color: var(--home-panel-heading, ${Color.darkerGray()});
`;
const byClass = css`
  margin-top: -0.4rem;
  font-size: 1.35rem;
  color: rgba(15, 23, 42, 0.66);
`;
const pillRowClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
`;
const payPillClass = css`
  background: ${Color.gold(0.95)};
  color: #5a3d05;
  border-radius: 999px;
  padding: 0.4rem 1rem;
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1.3;
`;
const playersClass = css`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${Color.logoBlue()};
`;
const statusClass = css`
  margin-top: 0.4rem;
  font-size: 1.35rem;
  color: rgba(15, 23, 42, 0.85);
`;
const barClass = css`
  height: 0.6rem;
  border-radius: 0.3rem;
  background: rgba(15, 23, 42, 0.08);
  overflow: hidden;
  > i {
    display: block;
    height: 100%;
    background: ${Color.green()};
    border-radius: 0.3rem;
    transition: width 0.3s ease;
  }
`;
const actionsClass = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: auto;
  padding-top: 0.6rem;
`;
const favoriteClass = css`
  width: 4.4rem;
  height: 4.4rem;
  border-radius: 999px;
  font-size: 1.6rem;
`;
