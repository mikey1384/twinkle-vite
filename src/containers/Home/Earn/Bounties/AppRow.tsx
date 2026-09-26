import React from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Link from '~/components/Link';
import { Color, borderRadius } from '~/constants/css';
import { SITE_NAME } from '~/constants/siteBrand';
import type { EarnHubApp } from './useEarnHub';
import { getAppPayout, getPlayersLine, newBadgeClass } from './appCardHelpers';

// One line of the desktop "See all apps" list: rank, picture, who made it,
// what it pays and how many played this week. Phones use AppCard rows instead.
export default function AppRow({ app }: { app: EarnHubApp }) {
  const navigate = useNavigate();
  const playersLine = getPlayersLine(app);
  return (
    <li className={rowClass}>
      <span className={rankClass}>{app.popularity?.rank ?? ''}</span>
      <div
        className={thumbClass}
        style={
          app.thumbnailUrl
            ? { backgroundImage: `url(${app.thumbnailUrl})` }
            : undefined
        }
        aria-hidden
      >
        {!app.thumbnailUrl && app.title.slice(0, 1)}
      </div>
      <div className={mainClass}>
        <div className={titleClass}>
          {app.title}
          {app.popularity?.isNew && <span className={newBadgeClass}>New</span>}
        </div>
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
          )}
        </div>
      </div>
      <div className={factsClass}>
        <span className={payClass}>{getAppPayout(app)}</span>
        {playersLine && <span className={playersClass}>{playersLine}</span>}
      </div>
      <Button
        color="logoBlue"
        variant="solid"
        tone="flat"
        shape="pill"
        size="sm"
        style={{ minWidth: '8rem' }}
        onClick={() => navigate(`/app/${app.buildId}`)}
      >
        Play
      </Button>
    </li>
  );
}

const rowClass = css`
  display: grid;
  grid-template-columns: 3rem 6.4rem minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 1.4rem;
  padding: 1rem 1.4rem;
  border-radius: ${borderRadius};
  border: 1px solid var(--home-panel-card-border, rgba(148, 163, 184, 0.35));
  background: rgba(255, 255, 255, 0.94);
`;
const rankClass = css`
  font-size: 1.8rem;
  font-weight: 800;
  color: rgba(15, 23, 42, 0.5);
  text-align: center;
`;
const thumbClass = css`
  width: 6.4rem;
  aspect-ratio: 1;
  border-radius: ${borderRadius};
  background: #101828 center / cover no-repeat;
  display: grid;
  place-items: center;
  font-size: 2.4rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
`;
const mainClass = css`
  min-width: 0;
`;
const titleClass = css`
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--home-panel-heading, ${Color.darkerGray()});
  overflow-wrap: anywhere;
`;
const byClass = css`
  font-size: 1.25rem;
  color: rgba(15, 23, 42, 0.66);
`;
const factsClass = css`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.2rem;
  text-align: right;
`;
const payClass = css`
  font-size: 1.3rem;
  font-weight: 800;
  color: #865910;
`;
const playersClass = css`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${Color.logoBlue()};
`;
