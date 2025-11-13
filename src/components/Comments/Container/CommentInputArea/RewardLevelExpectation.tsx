import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth, borderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
export default function RewardLevelExpectation({
  rewardLevel
}: {
  rewardLevel: number;
}) {
  const appliedRewardLevel = Math.max(3, rewardLevel);
  const rewardColor = useKeyContext(
    (v) => v.theme[`level${appliedRewardLevel}`]?.color
  );
  const rewardLevelExpectation = useMemo(() => {
    switch (rewardLevel) {
      case 3:
        return 'Moderate Effort';
      case 4:
        return 'A Lot of Effort';
      case 5:
        return 'Huge Effort';
      default:
        return '';
    }
  }, [rewardLevel]);
  const rewardLevelExpectationLabel = useMemo(() => {
    return (
      <>
        Put {rewardLevelExpectation} Into Your Response to Get Recommendations
      </>
    );
  }, [rewardLevelExpectation]);

  const rewardLevelExplanation = useMemo(() => {
    if (rewardLevelExpectation === '') {
      return '';
    }
    const accent = (Color as any)[rewardColor]?.() || Color.logoBlue();
    return (
      <div
        className={css`
          display: flex;
          gap: 0.8rem;
          align-items: flex-start;
          font-size: 1.5rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.2rem;
          }
        `}
      >
        <Icon icon="star" style={{ color: accent }} />
        <div>
          <div
            style={{ fontWeight: 700, color: accent }}
          >{`Effort Level ${rewardLevel}`}</div>
          <div style={{ color: Color.darkBlueGray() }}>
            {rewardLevelExpectationLabel}
          </div>
        </div>
      </div>
    );
  }, [
    rewardLevelExpectation,
    rewardColor,
    rewardLevel,
    rewardLevelExpectationLabel
  ]);

  if (!rewardLevelExpectation) return null;
  return (
    <div
      className={css`
        padding: 0.9rem 1.1rem;
        background: #fff;
        border: 1px solid var(--ui-border);
        border-radius: ${borderRadius};
        margin-bottom: 1rem;
        border-left: 4px solid
          ${(Color as any)[rewardColor]?.() || Color.logoBlue()};
      `}
    >
      {rewardLevelExplanation}
    </div>
  );
}
