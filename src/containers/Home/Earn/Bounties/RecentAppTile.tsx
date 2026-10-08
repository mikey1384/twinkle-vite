import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import { Color, borderRadius } from '~/constants/css';
import type { EarnHubApp } from './useEarnHub';
import { getAppStatus } from './appCardHelpers';
import { useBountySeen, useOpenBountyApp } from './bountyTracking';

// "Jump back in" (Mikey 10-08): one of the member's recently used apps, small,
// with what is left in it today and Play. The same compact row on phones.
export default function RecentAppTile({ app }: { app: EarnHubApp }) {
  const openApp = useOpenBountyApp();
  const seenRef = useBountySeen(app, 'recent');
  const status = getAppStatus(app);
  return (
    <li className={tileClass} ref={seenRef as React.Ref<HTMLLIElement>}>
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
        <div className={titleClass}>{app.title}</div>
        <div className={statusClass}>{status.line}</div>
      </div>
      <Button
        color="logoBlue"
        variant="solid"
        tone="flat"
        shape="pill"
        size="sm"
        onClick={() => openApp(app, 'recent')}
      >
        Play
      </Button>
    </li>
  );
}

const tileClass = css`
  display: grid;
  grid-template-columns: 4.8rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border-radius: ${borderRadius};
  border: 1px solid var(--home-panel-card-border, rgba(148, 163, 184, 0.35));
  background: rgba(255, 255, 255, 0.94);
  min-width: 0;
`;
const thumbClass = css`
  width: 4.8rem;
  aspect-ratio: 1;
  border-radius: ${borderRadius};
  background: #101828 center / cover no-repeat;
  display: grid;
  place-items: center;
  font-size: 2rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
`;
const mainClass = css`
  min-width: 0;
`;
const titleClass = css`
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--home-panel-heading, ${Color.darkerGray()});
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const statusClass = css`
  font-size: 1.2rem;
  color: rgba(15, 23, 42, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
