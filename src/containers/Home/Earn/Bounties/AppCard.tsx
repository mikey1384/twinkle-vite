import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Button from '~/components/Button';
import Link from '~/components/Link';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import type { EarnHubApp } from './useEarnHub';

// One approved app on the shelf: what it pays, who made it, and what this
// member still has left in it today. The button opens the published app.
export default function AppCard({ app }: { app: EarnHubApp }) {
  const navigate = useNavigate();
  const payout = useMemo(() => {
    const xp =
      app.minXP && app.minXP !== app.maxXP
        ? `${addCommasToNumber(app.minXP)} to ${addCommasToNumber(app.maxXP)} XP`
        : `up to ${addCommasToNumber(app.maxXP)} XP`;
    return app.maxCoins > 0
      ? `${xp} + ${addCommasToNumber(app.maxCoins)} Coins`
      : xp;
  }, [app.maxCoins, app.maxXP, app.minXP]);
  const rulesCount = app.rules.length;
  const status = useMemo(() => {
    const { today } = app;
    if (today.capReached) {
      return {
        line: `Done for today · +${addCommasToNumber(today.xp)} XP${
          today.coins ? ` + ${addCommasToNumber(today.coins)} Coins` : ''
        }`,
        ratio: 1,
        cta: 'Play again'
      };
    }
    if (app.kind === 'completion') {
      const cap = app.budgets.userDailyXP;
      return {
        line: `${today.earnedRules} of ${rulesCount} cleared today${
          cap ? ` · ${addCommasToNumber(today.xp)} / ${addCommasToNumber(cap)} XP` : ''
        }`,
        ratio: cap ? Math.min(1, today.xp / cap) : today.earnedRules / Math.max(1, rulesCount),
        cta: today.earnedRules ? 'Keep going' : 'Play'
      };
    }
    const tried = app.rules.some((rule) => rule.attemptsToday > 0 && !rule.earnedToday);
    if (today.earnedRules) {
      return {
        line: `Earned today · +${addCommasToNumber(today.xp)} XP${
          today.coins ? ` + ${addCommasToNumber(today.coins)} Coins` : ''
        }`,
        ratio: 1,
        cta: 'Open'
      };
    }
    return {
      line: tried
        ? `Today's bounty · tried, not solved yet`
        : `Today's bounty · not tried yet`,
      ratio: 0,
      cta: tried ? 'Try again' : app.rules.length > 1 ? "Try today's bounty" : 'Try it'
    };
  }, [app, rulesCount]);
  const subtitle =
    app.kind === 'completion'
      ? `${rulesCount} ${rulesCount === 1 ? 'reward' : 'rewards'}, once a day each`
      : app.budgets.userDailyClaims === 1
      ? `one bounty a day, ${rulesCount} ${rulesCount === 1 ? 'level' : 'levels'}`
      : `${rulesCount} ${rulesCount === 1 ? 'bounty' : 'bounties'}`;
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
        <span className={payPill}>{payout}</span>
      </div>
      <div className={bodyClass}>
        <h3 className={titleClass}>{app.title}</h3>
        <div className={byClass}>
          by{' '}
          {app.ownerUsername ? (
            <Link to={`/users/${app.ownerUsername}`} style={{ fontWeight: 700 }}>
              {app.ownerUsername}
            </Link>
          ) : (
            <b>a Twinkle member</b>
          )}{' '}
          · {subtitle}
        </div>
        <div className={statusClass}>{status.line}</div>
        <div className={barClass} role="img" aria-label={status.line}>
          <i style={{ width: `${Math.round(status.ratio * 100)}%` }} />
        </div>
        <Button
          color="logoBlue"
          variant="solid"
          tone="flat"
          shape="pill"
          size="md"
          stretch
          style={{ marginTop: 'auto' }}
          onClick={() => navigate(`/build/${app.buildId}`)}
        >
          {status.cta}
        </Button>
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
`;
const thumbClass = css`
  position: relative;
  aspect-ratio: 16 / 9;
  background: #101828 center / cover no-repeat;
  display: grid;
  place-items: center;
`;
const monogram = css`
  font-size: 4rem;
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const bodyClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.3rem 1.5rem 1.5rem;
  flex: 1;
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
