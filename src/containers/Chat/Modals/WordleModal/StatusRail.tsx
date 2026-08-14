import React, { useMemo, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import Icon from '~/components/Icon';
import SwitchButton from '~/components/Buttons/SwitchButton';
import DailyRewardBoostStrip, {
  getBoostStreakMultiplier,
  withAlpha
} from '~/components/DailyRewardBoostStrip';
import SkipShieldChecklist, {
  type SkipShieldChecklistState
} from './SkipShieldChecklist';
import {
  isSkipShieldChecklistItemDone,
  isSkipShieldReady
} from './skipShieldStatus';
import { Color, getStreakColor, mobileMaxWidth } from '~/constants/css';

const fireWiggle = keyframes`
  0%, 100% { transform: scale(1) rotate(-3deg); }
  50% { transform: scale(1.08) rotate(3deg); }
`;

const railClass = css`
  width: calc(100% - 4rem);
  margin: 1rem 2rem 0;
  padding: 0.6rem 0.8rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-radius: 12px;

  @media (max-width: ${mobileMaxWidth}) {
    width: calc(100% - 2rem);
    margin: 0.8rem 1rem 0;
    padding: 0.55rem 0.65rem;
    gap: 0.5rem;
  }
`;

const chipClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.1;
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-1px);
    }
  }

  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.35rem 0.65rem;
    gap: 0.4rem;
    font-size: 1rem;
  }
`;

const tileClass = css`
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1rem;
  transition:
    background 200ms ease,
    color 200ms ease,
    border-color 200ms ease;

  @media (max-width: ${mobileMaxWidth}) {
    width: 1.6rem;
    height: 1.6rem;
    font-size: 1rem;
  }
`;

const spacerClass = css`
  flex: 1;
  min-width: 0.2rem;
`;

const detailsClass = css`
  width: calc(100% - 4rem);
  margin: 0.8rem 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  @media (max-width: ${mobileMaxWidth}) {
    width: calc(100% - 2rem);
    margin: 0.7rem 1rem 0;
  }
`;

const expandButtonClass = css`
  width: 2.6rem;
  height: 2.6rem;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--ui-border);
  background: #fff;
  color: ${Color.darkGray()};
  font-size: 1.1rem;
  cursor: pointer;
  transition:
    transform 120ms ease,
    border-color 120ms ease,
    color 120ms ease;

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-1px);
      color: ${Color.darkerGray()};
      border-color: var(--ui-border-strong);
    }
  }
`;

// Mini "wordle tile" completion marker: a tiny grid cell that fills with the
// game palette when the condition is met.
function TileDot({
  achieved,
  icon,
  color,
  label
}: {
  achieved: boolean;
  icon: string;
  color: string;
  label: string;
}) {
  return (
    <span
      role="img"
      aria-label={`${label}: ${achieved ? 'done' : 'not yet'}`}
      title={label}
      className={`${tileClass} ${css`
        background: ${achieved ? color : Color.white()};
        color: ${achieved ? Color.white() : withAlpha(color, 0.45)};
        border: 1px solid ${achieved ? color : withAlpha(color, 0.35)};
      `}`}
    >
      <Icon icon={icon} />
    </span>
  );
}

export default function StatusRail({
  streak,
  wordleTask,
  skipShieldChecklist,
  isStrictMode,
  strictToggleDisabled,
  strictToggleSaving,
  onToggleStrictMode
}: {
  streak: number;
  wordleTask: any;
  skipShieldChecklist: SkipShieldChecklistState | null;
  isStrictMode: boolean;
  strictToggleDisabled: boolean;
  strictToggleSaving: boolean;
  onToggleStrictMode: (nextStrictMode: boolean) => void;
}) {
  const [detailsShown, setDetailsShown] = useState(false);
  const streakDays = Math.max(0, Number(streak) || 0);
  const streakColor = getStreakColor(streakDays);
  const multiplier = getBoostStreakMultiplier(streakDays);
  const basicAchieved = !!wordleTask?.basicQualified;
  const excellenceAchieved = !!wordleTask?.excellenceQualified;
  const shieldReady = isSkipShieldReady(skipShieldChecklist);
  const builtWithLumineDone = skipShieldChecklist
    ? isSkipShieldChecklistItemDone(skipShieldChecklist, 'builtWithLumineToday')
    : false;
  const triedPeerBuildDone = skipShieldChecklist
    ? isSkipShieldChecklistItemDone(skipShieldChecklist, 'triedPeerBuildToday')
    : false;

  const streakTitle = useMemo(
    () =>
      `${streakDays}-day Daily Tasks streak — x${multiplier} boost for Basic and Excellence, up to x${
        multiplier * multiplier
      } total reward`,
    [multiplier, streakDays]
  );

  return (
    <>
      <section aria-label="Wordle daily status" className={railClass}>
        {streakDays > 0 && (
          <button
            type="button"
            title={streakTitle}
            aria-label={streakTitle}
            onClick={() => setDetailsShown((shown) => !shown)}
            className={`${chipClass} ${css`
              color: ${streakColor};
              background: ${withAlpha(streakColor, 0.1)};
              border-color: ${withAlpha(streakColor, 0.25)};
            `}`}
          >
            <span
              className={css`
                display: inline-flex;
                line-height: 1;
                font-size: ${
                  streakDays >= 10
                    ? '1.25rem'
                    : streakDays >= 5
                      ? '1.15rem'
                      : '1.05rem'
                };
                animation: ${
                  streakDays >= 5
                    ? `${fireWiggle} 0.6s ease-in-out infinite`
                    : 'none'
                };
              `}
            >
              🔥
            </span>
            <span>{streakDays}-day</span>
            <span
              className={css`
                opacity: 0.85;
                font-weight: 700;
              `}
            >
              ×{multiplier} boost
            </span>
            {streakDays >= 10 && (
              <Icon icon="sparkles" style={{ fontSize: '1rem' }} />
            )}
          </button>
        )}
        <button
          type="button"
          title="Today's Wordle — check: solve it, star: solve it in 4 guesses"
          onClick={() => setDetailsShown((shown) => !shown)}
          className={`${chipClass} ${css`
            color: ${Color.orange()};
            background: ${Color.orange(0.08)};
            border-color: ${Color.orange(0.25)};
          `}`}
        >
          <span>Today</span>
          <TileDot
            achieved={basicAchieved}
            icon="check"
            color={Color.green()}
            label="Basic: solve today's Wordle"
          />
          <TileDot
            achieved={excellenceAchieved}
            icon="star"
            color={Color.gold()}
            label="Excellence: solve in 4 guesses"
          />
        </button>
        {skipShieldChecklist && (
          <button
            type="button"
            title={
              shieldReady
                ? "Skip protection ready — you're covered if you leave today's word unfinished"
                : 'Skip protection — build with Lumine and try a member’s app to protect your streak if you leave the word unfinished'
            }
            onClick={() => setDetailsShown((shown) => !shown)}
            className={`${chipClass} ${css`
              color: ${shieldReady ? Color.limeGreen() : Color.blueGray()};
              background: ${
                shieldReady ? Color.limeGreen(0.08) : Color.blueGray(0.08)
              };
              border-color: ${
                shieldReady ? Color.limeGreen(0.3) : Color.blueGray(0.22)
              };
            `}`}
          >
            <span
              className={css`
                line-height: 1;
                font-size: 1.15rem;
              `}
            >
              🛡️
            </span>
            {shieldReady ? (
              <span>Protected</span>
            ) : (
              <>
                <TileDot
                  achieved={builtWithLumineDone}
                  icon="robot"
                  color={Color.logoBlue()}
                  label="Built with Lumine today"
                />
                <TileDot
                  achieved={triedPeerBuildDone}
                  icon="play"
                  color={Color.logoBlue()}
                  label="Tried a member's app today"
                />
              </>
            )}
          </button>
        )}
        <div className={spacerClass} />
        <div
          title="Aim for Double Bonus — use every revealed hint in your next guess to double your reward"
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.7rem;
            padding: 0.3rem 0.45rem 0.3rem 0.9rem;
            border-radius: 999px;
            border: 1px solid
              ${isStrictMode ? Color.gold(0.55) : 'var(--ui-border)'};
            background: ${isStrictMode ? Color.gold(0.12) : '#fff'};
            transition:
              background 200ms ease,
              border-color 200ms ease;
          `}
        >
          <span
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.45rem;
              font-size: 1.1rem;
              font-weight: 800;
              white-space: nowrap;
              color: ${isStrictMode ? Color.darkGold() : Color.darkGray()};
              transition: color 200ms ease;
            `}
          >
            <Icon
              icon="star"
              style={{
                fontSize: '1rem',
                color: isStrictMode ? Color.gold() : Color.gray()
              }}
            />
            Double Bonus
          </span>
          <SwitchButton
            small
            checked={isStrictMode}
            disabled={
              strictToggleSaving || (strictToggleDisabled && !isStrictMode)
            }
            color={Color.gold()}
            ariaLabel="Aim for Double Bonus"
            onChange={() => {
              if (strictToggleSaving) return;
              onToggleStrictMode(!isStrictMode);
            }}
          />
        </div>
        <button
          type="button"
          aria-label={detailsShown ? 'Hide details' : 'Show details'}
          aria-expanded={detailsShown}
          onClick={() => setDetailsShown((shown) => !shown)}
          className={expandButtonClass}
        >
          <Icon icon={detailsShown ? 'chevron-up' : 'chevron-down'} />
        </button>
      </section>
      {detailsShown && (
        <div className={detailsClass}>
          <DailyRewardBoostStrip
            focus="wordle"
            streak={streakDays}
            wordle={wordleTask}
          />
          {skipShieldChecklist && (
            <SkipShieldChecklist checklist={skipShieldChecklist} compact bare />
          )}
        </div>
      )}
    </>
  );
}
