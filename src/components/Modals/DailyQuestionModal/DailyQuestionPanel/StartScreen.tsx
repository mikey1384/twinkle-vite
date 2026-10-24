import React from 'react';
import LumineRescueEntry from '~/components/LumineRescueEntry';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import {
  INACTIVITY_LIMIT,
  MAX_RESPONSE_LENGTH,
  MIN_RESPONSE_LENGTH,
  STREAK_REPAIR_COST
} from './constants';
import { buttonContainerCls, containerCls, questionTextCls } from './styles';
import {
  PAPER,
  paperPrimaryButtonCls,
  paperSecondaryButtonCls,
  paperTextButtonCls
} from '../paperTheme';

// Daily Reflection's start screen in the page's paper-and-ink style (Mikey
// 2026-10-12: no traces of the old modal look). Same behaviour as before.
export default function StartScreen({
  currentStreak,
  dayKeyword,
  hasEnoughCoins,
  isKeywordDay,
  isPictureDay,
  isSimplified,
  isSimplifying,
  purchasingRepair,
  question,
  recoveryNotice,
  streakAtRisk,
  streakBroken,
  streakRepairAvailable,
  todayCurrentFocusLabel,
  todayVibeLabel,
  trainingLabel,
  twinkleCoins,
  onClose,
  onPurchaseRepair,
  onRescueRepaired,
  onShowOriginal,
  onSimplify,
  onStart
}: {
  currentStreak: number;
  dayKeyword?: string;
  hasEnoughCoins: boolean;
  isKeywordDay?: boolean;
  // Picture Day keeps Word Day's start (streak, repair) with its own lead
  isPictureDay?: boolean;
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
  // Training mode: the stat today's question trains
  trainingLabel?: string | null;
  twinkleCoins?: number;
  onClose: () => void;
  onPurchaseRepair: () => void;
  onRescueRepaired?: (result: any) => void;
  onShowOriginal: () => void;
  onSimplify: () => void;
  onStart: () => void;
}) {
  const showStreak = currentStreak > 0 && !streakBroken && !streakAtRisk;

  return (
    <ErrorBoundary componentPath="DailyQuestionPanel/Start">
      <div className={containerCls}>
        {recoveryNotice && (
          <div className={noticeCls(PAPER.accent, PAPER.accentSoft)}>
            <p>{recoveryNotice}</p>
          </div>
        )}

        <div className={metaRowCls}>
          {trainingLabel && (
            <span className={metaChipCls}>
              <span className={metaLabelCls}>Training</span>
              {trainingLabel}
            </span>
          )}
          {!trainingLabel && !isKeywordDay && (
            <>
              <span className={metaChipCls}>
                <span className={metaLabelCls}>Vibe</span>
                {todayVibeLabel}
              </span>
              <span className={metaChipCls}>
                <span className={metaLabelCls}>Focus</span>
                {todayCurrentFocusLabel}
              </span>
            </>
          )}
          {showStreak && (
            <span className={metaChipCls}>
              <Icon icon="fire" style={{ color: PAPER.accent }} />
              {currentStreak}-day streak
              <span className={metaFaintCls}>
                {isKeywordDay
                  ? 'write anything to keep it'
                  : `x${Math.min(currentStreak + 1, 10)} XP today`}
              </span>
            </span>
          )}
        </div>

        {(streakAtRisk || streakBroken) &&
          currentStreak > 0 &&
          !streakRepairAvailable && (
            <LumineRescueEntry
              eventType="dailyReflection"
              active
              onRedeemed={(result) => onRescueRepaired?.(result)}
              style={{ marginBottom: '1rem', textAlign: 'left' }}
            />
          )}

        {streakAtRisk && currentStreak > 0 && (
          <div className={noticeCls(PAPER.warn, PAPER.warnSoft)}>
            <strong>You missed yesterday</strong>
            <p>
              Your {currentStreak}-day streak is broken. Use a repair today to
              restore it and continue to {currentStreak + 1} days when you
              answer.
            </p>
            {streakRepairAvailable ? (
              <p className={noticeGoodCls}>
                Repair ready: answer today to restore your {currentStreak}-day
                streak and continue to {currentStreak + 1} days.
              </p>
            ) : (
              <button
                aria-busy={purchasingRepair}
                type="button"
                className={paperSecondaryButtonCls}
                onClick={onPurchaseRepair}
                disabled={purchasingRepair || !hasEnoughCoins}
              >
                <Icon icon="wrench" />
                {purchasingRepair
                  ? 'Restoring...'
                  : hasEnoughCoins
                    ? `Restore streak (${STREAK_REPAIR_COST.toLocaleString()} coins)`
                    : `Need ${STREAK_REPAIR_COST.toLocaleString()} coins (you have ${(
                        twinkleCoins || 0
                      ).toLocaleString()})`}
                {(purchasingRepair) && (
                  <Icon icon="spinner" pulse style={{ marginLeft: '0.7rem' }} />
                )}
              </button>
            )}
          </div>
        )}

        {streakBroken && (
          <div className={noticeCls(PAPER.inkFaint, PAPER.paperDeep)}>
            <strong>Your streak was broken</strong>
            <p>Start a new streak by answering today.</p>
          </div>
        )}

        {streakRepairAvailable &&
          !streakAtRisk &&
          !streakBroken &&
          currentStreak > 0 && (
            <div className={noticeCls(PAPER.done, PAPER.doneSoft)}>
              <p className={noticeGoodCls}>
                Streak repair ready: your streak is protected.
              </p>
            </div>
          )}

        {isPictureDay ? (
          <div className={keywordCls}>
            <span className={metaLabelCls}>Picture Day</span>
            <p className={keywordHintCls}>
              Describe a picture you have in mind and Twinkle paints it, or
              write about anything at all
            </p>
          </div>
        ) : isKeywordDay && dayKeyword ? (
          <div className={keywordCls}>
            <span className={metaLabelCls}>Today’s word</span>
            <p className={keywordWordCls}>{dayKeyword}</p>
            <p className={keywordHintCls}>or write about anything else</p>
          </div>
        ) : (
          <p className={questionTextCls}>{question}</p>
        )}

        {!isKeywordDay && (
          <button
            aria-busy={isSimplifying}
            type="button"
            className={paperTextButtonCls}
            onClick={isSimplified ? onShowOriginal : onSimplify}
            disabled={isSimplifying}
            style={{ marginBottom: '1.6rem' }}
          >
            <Icon
              icon={isSimplified ? 'undo' : 'child'}
              style={{ marginRight: '0.5rem' }}
            />
            {isSimplified
              ? 'Show the original question'
              : isSimplifying
                ? 'Making it easier...'
                : 'Make it easier to understand'}
            {(isSimplifying) && (
              <Icon icon="spinner" pulse style={{ marginLeft: '0.7rem' }} />
            )}
          </button>
        )}

        {!isKeywordDay && (
          <div className={rulesCls}>
            <div className={rulesTitleCls}>How it works</div>
            <ul>
              <li>
                <Icon icon="clock" />
                <span>
                  <b>Keep typing.</b> Stop for more than{' '}
                  <em>{INACTIVITY_LIMIT} seconds</em> and your answer is sent.
                </span>
              </li>
              <li>
                <Icon icon="pencil-alt" />
                <span>
                  <b>At least {MIN_RESPONSE_LENGTH} characters,</b> up to{' '}
                  {MAX_RESPONSE_LENGTH.toLocaleString()}. Shorter is an{' '}
                  <em>automatic fail</em>.
                </span>
              </li>
              <li>
                <Icon icon="arrow-right" />
                <span>
                  <b>No going back.</b> <em>Backspace and delete are off</em>,
                  so keep moving forward.
                </span>
              </li>
              <li>
                <Icon icon="ban" />
                <span>
                  <b>No copy-paste.</b> Use your own words.
                </span>
              </li>
              <li>
                <Icon icon="sign-out-alt" />
                <span>
                  <b>Leaving this page cancels.</b> Your answer{' '}
                  <em>won’t be saved</em>.
                </span>
              </li>
            </ul>
          </div>
        )}

        <div className={buttonContainerCls}>
          <button
            type="button"
            className={paperTextButtonCls}
            onClick={onClose}
          >
            Not now
          </button>
          <button
            type="button"
            className={paperPrimaryButtonCls}
            onClick={onStart}
          >
            {isPictureDay ? 'Describe my picture' : 'Start writing'}
            <Icon icon="arrow-right" />
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function noticeCls(edge: string, background: string) {
  return css`
    width: 100%;
    max-width: calc(620 * var(--px));
    margin-bottom: 1.4rem;
    padding: 1rem 1.3rem;
    border-radius: 12px;
    border-left: 4px solid ${edge};
    background: ${background};
    color: ${PAPER.ink};
    font-size: 1.3rem;
    line-height: 1.5;
    strong {
      display: block;
      font-size: 1.4rem;
      margin-bottom: 0.3rem;
    }
    p {
      margin: 0 0 0.6rem;
    }
    p:last-child {
      margin-bottom: 0;
    }
  `;
}

const noticeGoodCls = css`
  color: ${PAPER.done};
  font-weight: 700;
`;

const metaRowCls = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: 1.8rem;
  &:empty {
    display: none;
  }
`;

const metaChipCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  border: 1px solid ${PAPER.line};
  background: ${PAPER.paper};
  color: ${PAPER.ink};
  font-size: 1.25rem;
  font-weight: 600;
`;

const metaLabelCls = css`
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${PAPER.accent};
`;

const metaFaintCls = css`
  color: ${PAPER.inkFaint};
  font-weight: 500;
`;

const keywordCls = css`
  text-align: center;
  margin-bottom: 2rem;
`;

const keywordWordCls = css`
  margin: 0.4rem 0;
  font-family: ${PAPER.serif};
  font-size: 4rem;
  font-weight: 600;
  color: ${PAPER.ink};
`;

const keywordHintCls = css`
  margin: 0;
  font-size: 1.3rem;
  font-style: italic;
  color: ${PAPER.inkSoft};
`;

const rulesCls = css`
  width: 100%;
  max-width: calc(620 * var(--px));
  margin-bottom: 1.6rem;
  padding: 1.2rem 1.5rem;
  border-radius: 14px;
  background: ${PAPER.paperDeep};
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.75rem;
  }
  li {
    display: grid;
    grid-template-columns: 1.8rem 1fr;
    gap: 0.6rem;
    align-items: baseline;
    font-size: 1.35rem;
    line-height: 1.5;
    color: ${PAPER.inkSoft};
    svg {
      color: ${PAPER.accent};
    }
  }
  b {
    color: ${PAPER.ink};
  }
  em {
    font-style: normal;
    font-weight: 700;
    color: ${PAPER.warn};
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1rem 1.1rem;
    li {
      font-size: 1.25rem;
    }
  }
`;

const rulesTitleCls = css`
  margin-bottom: 0.8rem;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${PAPER.inkFaint};
`;
