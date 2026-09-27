import React, { useState } from 'react';
import { css, cx } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import type { EarnHubApp } from './useEarnHub';
import {
  getRuleConditions,
  getRulePayout,
  getRuleState
} from './appCardHelpers';

// Every reward one app pays, in plain words: what it pays, how to earn it
// (the app's own howTo from rewards.json), how often, and where this member
// stands on it today, with the app's daily cap and a fair-play note. Opened
// from any App Store card; everything shown is the server's Earn hub answer.
export function AppRewardsButton({
  app,
  className
}: {
  app: EarnHubApp;
  className?: string;
}) {
  const [shown, setShown] = useState(false);
  const count = app.rules.length;
  if (!count) return null;
  return (
    <>
      <button
        type="button"
        className={cx(linkButtonClass, className)}
        aria-haspopup="dialog"
        onClick={() => setShown(true)}
      >
        {count === 1 ? 'How to earn it' : `See all ${count} rewards`}
        <Icon icon="chevron-right" style={{ marginLeft: '0.5rem' }} />
      </button>
      {shown && <AppRewardsModal app={app} onHide={() => setShown(false)} />}
    </>
  );
}

export default function AppRewardsModal({
  app,
  onHide
}: {
  app: EarnHubApp;
  onHide: () => void;
}) {
  const navigate = useNavigate();
  const { budgets, today } = app;
  return (
    <Modal
      modalKey="EarnAppRewardsModal"
      isOpen
      size="md"
      onClose={onHide}
      title={`Rewards in ${app.title}`}
      aria-label={`Rewards in ${app.title}`}
      footer={
        <div className={footerClass}>
          <Button variant="ghost" onClick={onHide}>
            Close
          </Button>
          <Button
            color="logoBlue"
            variant="solid"
            tone="flat"
            shape="pill"
            onClick={() => {
              onHide();
              navigate(`/app/${app.buildId}`);
            }}
          >
            Play {app.title}
          </Button>
        </div>
      }
    >
      <div className={bodyClass}>
        {budgets.userDailyXP > 0 || budgets.userDailyCoins > 0 ? (
          <section className={todayClass} aria-label="Today in this app">
            <div className={todayHeadClass}>
              <strong>Today in this app</strong>
              <span>
                {today.capReached
                  ? 'Daily cap reached · back tomorrow'
                  : today.possible && (today.possible.xp || today.possible.coins)
                    ? `Still up for grabs: ${[
                        today.possible.xp
                          ? `${addCommasToNumber(today.possible.xp)} XP`
                          : '',
                        today.possible.coins
                          ? `${addCommasToNumber(today.possible.coins)} Coins`
                          : ''
                      ]
                        .filter(Boolean)
                        .join(' + ')}`
                    : ''}
              </span>
            </div>
            {budgets.userDailyXP > 0 && (
              <Meter label="XP" value={today.xp} max={budgets.userDailyXP} />
            )}
            {budgets.userDailyCoins > 0 && (
              <Meter
                label="Coins"
                value={today.coins}
                max={budgets.userDailyCoins}
              />
            )}
            <p className={fineClass}>
              The daily cap is the most this app can pay you in one day. A new
              day starts at midnight UTC (9 AM in Korea).
            </p>
          </section>
        ) : null}
        <ol className={listClass}>
          {app.rules.map((rule) => {
            const state = getRuleState(rule);
            return (
              <li key={rule.id} className={cx(ruleClass, stateClass[state.key])}>
                <span
                  className={cx(
                    markClass,
                    (state.key === 'earned' || state.key === 'collected') &&
                      markDoneClass
                  )}
                  aria-hidden
                >
                  {state.key === 'earned' || state.key === 'collected' ? (
                    <Icon icon="check" />
                  ) : null}
                </span>
                <div className={ruleMainClass}>
                  <h4 className={ruleTitleClass}>{rule.title}</h4>
                  {rule.howTo && <p className={howToClass}>{rule.howTo}</p>}
                  <ul className={chipsClass} aria-label="Conditions">
                    {getRuleConditions(rule).map((condition) => (
                      <li key={condition}>{condition}</li>
                    ))}
                    <li className={stateChipClass[state.key]}>{state.label}</li>
                  </ul>
                </div>
                <div className={payClass}>
                  {rule.earnedToday
                    ? getRulePayout({ ...rule, ...rule.earnedToday })
                    : getRulePayout(rule)}
                </div>
              </li>
            );
          })}
        </ol>
        <aside className={fairClass}>
          <Icon icon="exclamation-triangle" className={fairIconClass} />
          <div>
            <strong>Play fair</strong>
            <p>
              Rewards are for real play. Collecting them with extra accounts,
              scripts or bots is against the rules: those rewards are taken
              back and the account can be banned.
            </p>
          </div>
        </aside>
      </div>
    </Modal>
  );
}

function Meter({
  label,
  value,
  max
}: {
  label: string;
  value: number;
  max: number;
}) {
  const ratio = Math.min(1, value / Math.max(1, max));
  const text = `${addCommasToNumber(value)} of ${addCommasToNumber(max)} ${label}`;
  return (
    <div className={meterClass}>
      <span className={meterLabelClass}>{text}</span>
      <div
        className={meterBarClass}
        role="progressbar"
        aria-label={`${label} earned today`}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(value, max)}
        aria-valuetext={text}
      >
        <i style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  );
}

const ink = '#0f172a';
const muted = 'rgba(15, 23, 42, 0.72)';

export const linkButtonClass = css`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0;
  border: 0;
  background: none;
  color: ${Color.darkOceanBlue()};
  font: inherit;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid ${Color.logoBlue()};
    outline-offset: 2px;
    border-radius: 4px;
  }
`;
const footerClass = css`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;
const bodyClass = css`
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  width: 100%;
  color: ${ink};
`;
const todayClass = css`
  display: grid;
  gap: 0.8rem;
  padding: 1.2rem 1.4rem;
  border-radius: ${borderRadius};
  background: ${Color.logoBlue(0.07)};
  border: 1px solid ${Color.logoBlue(0.22)};
`;
const todayHeadClass = css`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  font-size: 1.4rem;
  > span {
    color: ${muted};
    font-size: 1.3rem;
  }
`;
const meterClass = css`
  display: grid;
  grid-template-columns: minmax(12rem, auto) minmax(0, 1fr);
  align-items: center;
  gap: 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    gap: 0.3rem;
  }
`;
const meterLabelClass = css`
  font-size: 1.3rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;
const meterBarClass = css`
  height: 0.8rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.1);
  overflow: hidden;
  > i {
    display: block;
    height: 100%;
    background: ${Color.green()};
    border-radius: 999px;
  }
`;
const fineClass = css`
  margin: 0;
  font-size: 1.2rem;
  color: ${muted};
`;
const listClass = css`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.8rem;
`;
const ruleClass = css`
  display: grid;
  grid-template-columns: 2.6rem minmax(0, 1fr) auto;
  gap: 0.4rem 1.2rem;
  align-items: start;
  padding: 1.2rem 1.4rem;
  border-radius: ${borderRadius};
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: #fff;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 2.6rem minmax(0, 1fr);
    padding: 1.1rem 1.2rem;
  }
`;
const stateClass = {
  earned: css`
    background: ${Color.green(0.06)};
    border-color: ${Color.green(0.35)};
  `,
  collected: css`
    background: rgba(15, 23, 42, 0.03);
  `,
  unavailable: css`
    background: rgba(15, 23, 42, 0.03);
  `,
  open: ''
};
const markClass = css`
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 999px;
  border: 2px solid rgba(15, 23, 42, 0.25);
  display: grid;
  place-items: center;
  font-size: 1.3rem;
  color: #fff;
`;
const markDoneClass = css`
  border-color: ${Color.green()};
  background: ${Color.green()};
`;
const ruleMainClass = css`
  min-width: 0;
  display: grid;
  gap: 0.4rem;
`;
const ruleTitleClass = css`
  margin: 0;
  font-size: 1.55rem;
  font-weight: 800;
  line-height: 1.35;
  overflow-wrap: anywhere;
`;
const howToClass = css`
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.5;
  color: ${muted};
`;
const chipsClass = css`
  list-style: none;
  margin: 0.2rem 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  > li {
    padding: 0.15rem 0.8rem;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.06);
    color: #334155;
    font-size: 1.15rem;
    font-weight: 700;
    line-height: 1.6;
  }
`;
const stateChipClass = {
  earned: css`
    && {
      background: ${Color.green(0.14)};
      color: #1b6e1e;
    }
  `,
  collected: css`
    && {
      background: ${Color.green(0.14)};
      color: #1b6e1e;
    }
  `,
  unavailable: css`
    && {
      color: #6b4b00;
      background: ${Color.gold(0.2)};
    }
  `,
  open: css`
    && {
      background: ${Color.logoBlue(0.12)};
      color: ${Color.darkerOceanBlue()};
    }
  `
};
const payClass = css`
  justify-self: end;
  padding: 0.3rem 0.9rem;
  border-radius: 999px;
  background: ${Color.gold(0.22)};
  color: #5a3d05;
  font-size: 1.3rem;
  font-weight: 800;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  @media (max-width: ${mobileMaxWidth}) {
    grid-column: 2;
    justify-self: start;
    margin-top: 0.3rem;
  }
`;
const fairClass = css`
  display: flex;
  gap: 1.1rem;
  align-items: flex-start;
  padding: 1.2rem 1.4rem;
  border-radius: ${borderRadius};
  background: #fff7e6;
  border: 1px solid #f3c56b;
  color: #5c3b00;
  strong {
    font-size: 1.4rem;
  }
  p {
    margin: 0.3rem 0 0;
    font-size: 1.3rem;
    line-height: 1.5;
  }
`;
const fairIconClass = css`
  margin-top: 0.3rem;
  font-size: 1.6rem;
  color: #b7791f;
`;
