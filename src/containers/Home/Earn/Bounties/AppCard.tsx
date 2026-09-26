import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import FavoriteButton from '~/components/Build/FavoriteButton';
import Link from '~/components/Link';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import type { EarnHubApp } from './useEarnHub';
import { SITE_NAME } from '~/constants/siteBrand';
import {
  getAppPayout,
  getAppStatus,
  getAppSubtitle,
  getPlayersLine,
  newBadgeClass
} from './appCardHelpers';

// One approved app on the shelf: what it pays, who made it, and what this
// member still has left in it today. The button opens the published app page
// (/app/:id) for everyone — including the app's own creator, who would land in
// the workspace editor if this pointed at /build/:id. When the server ranks
// the App Store, the card also carries its rank and this week's players; on
// phones this same card is the compact ranked row.
export default function AppCard({
  app,
  rank
}: {
  app: EarnHubApp;
  rank?: number;
}) {
  const navigate = useNavigate();
  // Follows the server's answer: the shelf's own value until the member
  // presses the star, then whatever the favorite request returned.
  const [favorited, setFavorited] = useState(Boolean(app.isFavorited));
  useEffect(() => {
    setFavorited(Boolean(app.isFavorited));
  }, [app.isFavorited]);
  const payout = getAppPayout(app);
  const status = getAppStatus(app);
  const subtitle = getAppSubtitle(app);
  const playersLine = rank ? getPlayersLine(app) : '';
  const isNew = Boolean(rank && app.popularity?.isNew);
  return (
    <article className={cardClass}>
      <div
        className={thumbClass}
        style={
          app.thumbnailUrl
            ? { backgroundImage: `url(${app.thumbnailUrl})` }
            : undefined
        }
        aria-hidden
      >
        {!app.thumbnailUrl && <span className={monogram}>{app.title.slice(0, 1)}</span>}
        {rank ? <span className={rankBadge}>#{rank}</span> : null}
        <span className={payPill}>{payout}</span>
      </div>
      <div className={bodyClass}>
        <div className={payLine}>{payout}</div>
        <h3 className={titleClass}>
          {app.title}
          {isNew && <span className={newBadgeClass}>New</span>}
        </h3>
        <div className={byClass}>
          by{' '}
          {app.ownerUsername ? (
            <Link to={`/users/${app.ownerUsername}`} style={{ fontWeight: 700 }}>
              {app.ownerUsername}
            </Link>
          ) : (
            <b>a {SITE_NAME} member</b>
          )}{' '}
          · {subtitle}
        </div>
        {playersLine && <div className={playersClass}>{playersLine}</div>}
        <div className={statusClass}>{status.line}</div>
        <div className={barClass} role="img" aria-label={status.line}>
          <i style={{ width: `${Math.round(status.ratio * 100)}%` }} />
        </div>
      </div>
      <div className={actionsClass}>
        <Button
          color="logoBlue"
          variant="solid"
          tone="flat"
          shape="pill"
          size="md"
          stretch
          onClick={() => navigate(`/app/${app.buildId}`)}
        >
          Play
        </Button>
        <FavoriteButton
          buildId={app.buildId}
          className={favoriteClass}
          favorited={favorited}
          title={app.title}
          onChange={(change) => setFavorited(change.isFavorited)}
        />
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
  min-width: 0;
  @media (max-width: ${mobileMaxWidth}) {
    display: grid;
    grid-template-columns: 9rem minmax(0, 1fr);
    align-items: start;
    padding: 1.2rem;
    gap: 0 1.2rem;
  }
`;
const thumbClass = css`
  position: relative;
  aspect-ratio: 16 / 9;
  background: #101828 center / cover no-repeat;
  display: grid;
  place-items: center;
  @media (max-width: ${mobileMaxWidth}) {
    aspect-ratio: 1;
    border-radius: ${borderRadius};
  }
`;
const favoriteClass = css`
  width: 4rem;
  height: 4rem;
  border-radius: 999px;
  font-size: 1.5rem;
`;
const actionsClass = css`
  padding: 0 1.5rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: auto;
  @media (max-width: ${mobileMaxWidth}) {
    grid-column: 1 / -1;
    padding: 1rem 0 0;
  }
`;
const payLine = css`
  display: none;
  font-size: 1.25rem;
  font-weight: 800;
  color: #865910;
  @media (max-width: ${mobileMaxWidth}) {
    display: block;
  }
`;
const monogram = css`
  font-size: 4rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 3rem;
  }
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
`;
const payPill = css`
  position: absolute;
  left: 1rem;
  bottom: 1rem;
  max-width: calc(100% - 2rem);
  background: ${Color.gold(0.95)};
  color: #5a3d05;
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.3;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  text-align: left;
  @media (max-width: ${mobileMaxWidth}) {
    display: none;
  }
`;
const bodyClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.3rem 1.5rem 0.6rem;
  flex: 1;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0;
    gap: 0.4rem;
  }
`;
const titleClass = css`
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--home-panel-heading, ${Color.darkerGray()});
`;
const byClass = css`
  margin-top: -0.4rem;
  font-size: 1.25rem;
  color: rgba(15, 23, 42, 0.66);
`;
const rankBadge = css`
  position: absolute;
  top: 0.8rem;
  left: 0.8rem;
  min-width: 3rem;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.82);
  color: #fff;
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1.4;
  text-align: center;
  @media (max-width: ${mobileMaxWidth}) {
    top: 0.5rem;
    left: 0.5rem;
    min-width: 2.6rem;
    padding: 0.1rem 0.6rem;
    font-size: 1.2rem;
  }
`;
const playersClass = css`
  margin-top: -0.3rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: ${Color.logoBlue()};
`;
const statusClass = css`
  font-size: 1.35rem;
  color: rgba(15, 23, 42, 0.85);
`;
const barClass = css`
  height: 0.6rem;
  border-radius: 0.3rem;
  background: rgba(15, 23, 42, 0.08);
  overflow: hidden;
  margin-bottom: 0.6rem;
  > i {
    display: block;
    height: 100%;
    background: ${Color.green()};
    border-radius: 0.3rem;
    transition: width 0.3s ease;
  }
  @media (max-width: ${mobileMaxWidth}) {
    margin-bottom: 0.4rem;
  }
`;
