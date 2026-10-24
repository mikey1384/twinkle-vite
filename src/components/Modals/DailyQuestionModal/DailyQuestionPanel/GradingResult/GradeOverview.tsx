import React from 'react';
import { css, keyframes } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { gradeLabels, gradeSymbols, masterpieceTypeLabels } from './constants';
import { PAPER } from '../../paperTheme';

// The grade in Daily Reflection's paper style (Mikey 2026-10-12): a quiet
// seal, the grade in serif, XP and streak as chips, and the feedback as a
// note. One settle-in animation instead of a constant pulse.
const GRADE_TONES: Record<string, { ink: string; soft: string }> = {
  Masterpiece: { ink: '#b8860b', soft: 'rgba(184, 134, 11, 0.14)' },
  Pass: { ink: PAPER.done, soft: PAPER.doneSoft },
  Fail: { ink: PAPER.warn, soft: PAPER.warnSoft }
};

const settle = keyframes`
  0% { transform: scale(0.7); opacity: 0; }
  70% { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

export default function GradeOverview({
  feedback,
  grade,
  isKeywordDay = false,
  masterpieceType,
  streak,
  streakMultiplier,
  usedRepair,
  xpAwarded
}: {
  feedback: string;
  grade: string;
  isKeywordDay?: boolean;
  masterpieceType?: 'heart' | 'mind' | 'heart_and_mind' | null;
  rewardColor?: string;
  streak: number;
  streakMultiplier: number;
  usedRepair: boolean;
  xpAwarded: number;
  xpNumberColor?: string;
}) {
  const tone = isKeywordDay
    ? GRADE_TONES.Pass
    : GRADE_TONES[grade] || { ink: PAPER.inkSoft, soft: PAPER.paperDeep };
  const gradeLabel = isKeywordDay
    ? 'Counted'
    : grade === 'Masterpiece' && masterpieceType
      ? masterpieceTypeLabels[masterpieceType] || 'Masterpiece'
      : gradeLabels[grade] || '';
  const gradeSymbol = isKeywordDay ? '✓' : gradeSymbols[grade] || '?';
  const showStreak = streak > 0 && grade !== 'Fail';

  return (
    <>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 1rem;
          margin-bottom: 1.6rem;
        `}
      >
        <div
          className={css`
            width: 92px;
            height: 92px;
            border-radius: 50%;
            background: ${tone.soft};
            border: 2px solid ${tone.ink};
            box-shadow: inset 0 0 0 5px ${PAPER.paper};
            display: flex;
            align-items: center;
            justify-content: center;
            animation: ${settle} 0.6s ease-out;
          `}
        >
          <span
            className={css`
              font-family: ${PAPER.serif};
              font-size: 3.4rem;
              color: ${tone.ink};
            `}
          >
            {gradeSymbol}
          </span>
        </div>
        <p
          className={css`
            margin: 0.8rem 0 0;
            font-family: ${PAPER.serif};
            font-size: 2.8rem;
            font-weight: 600;
            color: ${PAPER.ink};
            text-align: center;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 2.3rem;
            }
          `}
        >
          {gradeLabel}
        </p>
      </div>

      {(xpAwarded > 0 || showStreak) && (
        <div
          className={css`
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.6rem;
            margin-bottom: 1.8rem;
          `}
        >
          {xpAwarded > 0 && (
            <span className={chipCls}>
              <b style={{ color: PAPER.done }}>
                +{addCommasToNumber(xpAwarded)}
              </b>
              XP
            </span>
          )}
          {showStreak && (
            <span className={chipCls}>
              <Icon icon="fire" style={{ color: PAPER.accent }} />
              {streak}-day streak
              {streakMultiplier > 1 && !isKeywordDay && (
                <span style={{ color: PAPER.inkFaint, fontWeight: 500 }}>
                  {streakMultiplier >= 10
                    ? 'x10 max'
                    : `x${streakMultiplier} XP`}
                </span>
              )}
            </span>
          )}
          {showStreak && usedRepair && (
            <span className={chipCls} style={{ color: PAPER.done }}>
              Streak saved with a repair
            </span>
          )}
        </div>
      )}

      <div
        className={css`
          max-width: calc(680 * var(--px));
          margin: 0 auto 1.8rem;
          padding: 1.2rem 1.6rem;
          border-left: 3px solid ${PAPER.accent};
          background: ${PAPER.paperDeep};
          border-radius: 0 12px 12px 0;
        `}
      >
        <div
          className={css`
            margin-bottom: 0.4rem;
            font-size: 1.1rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: ${PAPER.accent};
          `}
        >
          {isKeywordDay ? 'Today' : 'Feedback'}
        </div>
        <p
          className={css`
            margin: 0;
            font-family: ${PAPER.serif};
            font-size: 1.7rem;
            color: ${PAPER.ink};
            line-height: 1.6;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.55rem;
            }
          `}
        >
          {feedback}
        </p>
      </div>
    </>
  );
}

const chipCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 1.1rem;
  border-radius: 999px;
  border: 1px solid ${PAPER.line};
  background: ${PAPER.paper};
  color: ${PAPER.ink};
  font-size: 1.35rem;
  font-weight: 600;
`;
