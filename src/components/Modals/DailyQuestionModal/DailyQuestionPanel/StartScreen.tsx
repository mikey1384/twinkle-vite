import React from 'react';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import {
  INACTIVITY_LIMIT,
  MIN_RESPONSE_LENGTH,
  STREAK_REPAIR_COST
} from './constants';
import {
  buttonContainerCls,
  containerCls,
  instructionBoxCls,
  instructionListCls,
  questionTextCls,
  ruleSuccessCls,
  ruleTitleCls,
  ruleWarningCls,
  todayPreferenceCardCls,
  todayPreferenceLabelCls,
  todayPreferenceRowCls,
  todayPreferenceValueCls
} from './styles';

function getStreakColor(currentStreak: number) {
  if (currentStreak >= 10) return '#FFD700';
  if (currentStreak >= 7) return '#E53935';
  if (currentStreak >= 4) return '#FF9800';
  return '#9E9E9E';
}

export default function StartScreen({
  currentStreak,
  hasEnoughCoins,
  isSimplified,
  isSimplifying,
  profileTheme,
  purchasingRepair,
  question,
  recoveryNotice,
  streakAtRisk,
  streakBroken,
  streakRepairAvailable,
  todayCurrentFocusLabel,
  todayVibeLabel,
  twinkleCoins,
  onClose,
  onPurchaseRepair,
  onShowOriginal,
  onSimplify,
  onStart
}: {
  currentStreak: number;
  hasEnoughCoins: boolean;
  isSimplified: boolean;
  isSimplifying: boolean;
  profileTheme?: string | null;
  purchasingRepair: boolean;
  question: string;
  recoveryNotice: string | null;
  streakAtRisk: boolean;
  streakBroken: boolean;
  streakRepairAvailable: boolean;
  todayCurrentFocusLabel: string;
  todayVibeLabel: string;
  twinkleCoins?: number;
  onClose: () => void;
  onPurchaseRepair: () => void;
  onShowOriginal: () => void;
  onSimplify: () => void;
  onStart: () => void;
}) {
  const streakColor = getStreakColor(currentStreak);

  return (
    <ErrorBoundary componentPath="DailyQuestionPanel/Start">
      <div className={containerCls}>
        {recoveryNotice && (
          <div
            className={css`
              text-align: center;
              margin-bottom: 1rem;
              padding: 0.75rem 1rem;
              border-radius: 10px;
              background: ${Color.yellow(0.18)};
              border: 1px solid ${Color.yellow(0.5)};
            `}
          >
            <p
              className={css`
                margin: 0;
                color: ${Color.darkerGray()};
                font-size: 1.1rem;
                line-height: 1.4;
                font-weight: 600;
              `}
            >
              {recoveryNotice}
            </p>
          </div>
        )}

        {currentStreak > 0 && !streakBroken && !streakAtRisk && (
          <div
            className={css`
              text-align: center;
              margin-bottom: 1.5rem;
              padding: 1rem 1.5rem;
              background: ${streakColor}15;
              border: 2px solid ${streakColor}40;
              border-radius: 12px;
            `}
          >
            <div
              className={css`
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
              `}
            >
              <span
                className={css`
                  font-size: 1.8rem;
                `}
              >
                🔥
              </span>
              <span
                className={css`
                  font-size: 1.5rem;
                  font-weight: bold;
                  color: ${streakColor};
                `}
              >
                {currentStreak}-day streak
              </span>
            </div>
            <p
              className={css`
                font-size: 1.2rem;
                color: ${Color.darkerGray()};
                margin-top: 0.3rem;
              `}
            >
              Keep it going for x{Math.min(currentStreak + 1, 10)} XP!
            </p>
          </div>
        )}

        {streakAtRisk && currentStreak > 0 && (
          <div
            className={css`
              text-align: center;
              margin-bottom: 1.5rem;
              padding: 1rem 1.5rem;
              background: ${Color.rose()}15;
              border: 2px solid ${Color.rose()}40;
              border-radius: 12px;
            `}
          >
            <p
              className={css`
                font-size: 1.3rem;
                font-weight: bold;
                color: ${Color.rose()};
                margin-bottom: 0.5rem;
              `}
            >
              ⚠️ You missed yesterday
            </p>
            <p
              className={css`
                font-size: 1.2rem;
                color: ${Color.darkerGray()};
                margin-bottom: 0.75rem;
              `}
            >
              Your {currentStreak}-day streak is broken. Use a repair today to
              restore it and continue to {currentStreak + 1} days when you
              answer.
            </p>
            {streakRepairAvailable ? (
              <p
                className={css`
                  font-size: 1.2rem;
                  color: ${Color.green()};
                  font-weight: 600;
                  margin-bottom: 0;
                `}
              >
                ✨ Repair ready — answer today to restore your {currentStreak}
                -day streak and continue to {currentStreak + 1} days.
              </p>
            ) : (
              <Button
                variant="solid"
                color="orange"
                onClick={onPurchaseRepair}
                disabled={purchasingRepair || !hasEnoughCoins}
                loading={purchasingRepair}
              >
                <Icon icon="wrench" style={{ marginRight: '0.5rem' }} />
                {hasEnoughCoins
                  ? `Restore Streak (${STREAK_REPAIR_COST.toLocaleString()} coins)`
                  : `Need ${STREAK_REPAIR_COST.toLocaleString()} coins (you have ${(
                      twinkleCoins || 0
                    ).toLocaleString()})`}
              </Button>
            )}
          </div>
        )}

        {streakBroken && (
          <div
            className={css`
              text-align: center;
              margin-bottom: 1.5rem;
              padding: 1rem 1.5rem;
              background: ${Color.gray()}10;
              border: 2px solid ${Color.borderGray()};
              border-radius: 12px;
            `}
          >
            <p
              className={css`
                font-size: 1.3rem;
                font-weight: bold;
                color: ${Color.darkerGray()};
                margin-bottom: 0.5rem;
              `}
            >
              Your streak was broken
            </p>
            <p
              className={css`
                font-size: 1.2rem;
                color: ${Color.darkerGray()};
                margin-bottom: 0;
              `}
            >
              Start a new streak by answering today.
            </p>
          </div>
        )}

        {streakRepairAvailable &&
          !streakAtRisk &&
          !streakBroken &&
          currentStreak > 0 && (
            <div
              className={css`
                text-align: center;
                margin-bottom: 1rem;
                padding: 0.75rem 1rem;
                background: ${Color.green()}15;
                border-radius: 8px;
              `}
            >
              <p
                className={css`
                  font-size: 1.2rem;
                  color: ${Color.green()};
                  font-weight: 600;
                `}
              >
                ✨ Streak repair ready - your streak is protected!
              </p>
            </div>
          )}

        <div className={todayPreferenceRowCls}>
          <div className={todayPreferenceCardCls}>
            <span className={todayPreferenceLabelCls}>Today's vibe</span>
            <span className={todayPreferenceValueCls}>{todayVibeLabel}</span>
          </div>
          <div className={todayPreferenceCardCls}>
            <span className={todayPreferenceLabelCls}>Current focus</span>
            <span className={todayPreferenceValueCls}>
              {todayCurrentFocusLabel}
            </span>
          </div>
        </div>

        <p className={questionTextCls}>{question}</p>

        <div
          className={css`
            margin-bottom: 1.5rem;
          `}
        >
          {isSimplified ? (
            <Button
              variant="soft"
              tone="raised"
              color={profileTheme || undefined}
              onClick={onShowOriginal}
              uppercase={false}
            >
              <Icon icon="undo" style={{ marginRight: '0.5rem' }} />
              Show original question
            </Button>
          ) : (
            <Button
              variant="soft"
              tone="raised"
              color={profileTheme || undefined}
              onClick={onSimplify}
              disabled={isSimplifying}
              loading={isSimplifying}
              uppercase={false}
            >
              <Icon icon="child" style={{ marginRight: '0.5rem' }} />
              {isSimplifying
                ? 'Simplifying...'
                : 'Make question easier to understand'}
            </Button>
          )}
        </div>

        <div className={instructionBoxCls}>
          <h4 style={{ marginBottom: '0.75rem', color: Color.black() }}>
            <Icon icon="info-circle" style={{ marginRight: '0.5rem' }} />
            Rules
          </h4>
          <ul className={instructionListCls}>
            <li>
              <span className={ruleTitleCls}>Keep typing</span> — if you stop
              for more than{' '}
              <span className={ruleWarningCls}>{INACTIVITY_LIMIT} seconds</span>
              , your response auto-submits
            </li>
            <li>
              <span className={ruleTitleCls}>Minimum length</span> — write at
              least{' '}
              <span className={ruleSuccessCls}>
                {MIN_RESPONSE_LENGTH} characters
              </span>{' '}
              before the timer runs out, or it's an{' '}
              <span className={ruleWarningCls}>automatic fail</span>
            </li>
            <li>
              <span className={ruleTitleCls}>No going back</span> —{' '}
              <span className={ruleWarningCls}>
                backspace and delete are disabled
              </span>
              . Just keep moving forward!
            </li>
            <li>
              <span className={ruleTitleCls}>No copy‑paste</span> — write in
              your own words
            </li>
            <li>
              <span className={ruleTitleCls}>Closing this window cancels</span>{' '}
              — your response{' '}
              <span className={ruleWarningCls}>won't be saved</span>, so you'll
              need to start over
            </li>
          </ul>
        </div>

        <div className={buttonContainerCls}>
          <Button variant="ghost" onClick={onClose}>
            Maybe Later
          </Button>
          <Button variant="solid" color="green" onClick={onStart}>
            <Icon icon="play" style={{ marginRight: '0.5rem' }} />
            Start Writing
          </Button>
        </div>
      </div>
    </ErrorBoundary>
  );
}
