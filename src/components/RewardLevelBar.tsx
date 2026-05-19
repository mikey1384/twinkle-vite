import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import {
  Color,
  borderRadius,
  desktopMinWidth,
  mobileMaxWidth,
  tabletMaxWidth
} from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

const rewardLevelLabel = 'Effort Level';
const compactRewardLevelQuery = `(max-width: ${mobileMaxWidth}), (min-width: ${desktopMinWidth}) and (max-width: ${tabletMaxWidth}) and (orientation: portrait)`;

export default function RewardLevelBar({
  className,
  rewardLevel,
  style
}: {
  className?: string;
  rewardLevel: number;
  style?: React.CSSProperties;
}) {
  const levelRole = useRoleColor(`level${rewardLevel}`, {
    fallback: 'logoBlue'
  });
  const themedBg = useMemo(
    () => levelRole.getColor() || Color.logoBlue(),
    [levelRole]
  );

  const starColor = useMemo(() => {
    return rewardLevel >= 5 ? '#fff' : 'var(--perfect-star-color, #ffd700)';
  }, [rewardLevel]);

  const fullStars = useMemo(() => {
    return Array.from({ length: rewardLevel }, (_, i) => (
      <Icon
        key={i}
        icon="star"
        aria-hidden="true"
        style={{
          marginLeft: '0.25rem',
          fontSize: '1.4em',
          color: starColor
        }}
      />
    ));
  }, [rewardLevel, starColor]);

  const compactStars = useMemo(() => {
    return Array.from({ length: rewardLevel }, (_, i) => (
      <Icon key={i} icon="star" aria-hidden="true" />
    ));
  }, [rewardLevel]);

  const xpAmountLabel = useMemo(() => {
    return addCommasToNumber(rewardLevel * 2000);
  }, [rewardLevel]);

  const earnUpToLabel = useMemo(() => {
    return `Earn up to ${xpAmountLabel} XP`;
  }, [xpAmountLabel]);
  const accessibilityLabel = useMemo(() => {
    return `${rewardLevelLabel} ${rewardLevel}. ${earnUpToLabel}`;
  }, [earnUpToLabel, rewardLevel]);

  return (
    <div
      aria-label={accessibilityLabel}
      role="group"
      className={`${className || ''} reward-level-bar ${css`
        background: ${themedBg};
        color: #fff;
        padding: 0.6rem 1rem;
        display: grid;
        grid-template-columns: minmax(0, auto) minmax(0, 1fr);
        align-items: center;
        column-gap: 0.75rem;
        border: none;
        border-radius: ${borderRadius};
        font-weight: 600;
        width: auto;
        max-width: 100%;
        min-width: 0;
        .reward-level-bar__full-left,
        .reward-level-bar__compact-left {
          margin: 0;
          align-items: center;
          justify-content: flex-start;
          min-width: 0;
        }
        .reward-level-bar__stars {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          white-space: nowrap;
        }
        .reward-level-bar__full-left {
          display: inline-flex;
          gap: 0.35rem;
        }
        .reward-level-bar__compact-left {
          display: none;
          gap: 0.2rem;
          white-space: nowrap;
          color: ${starColor};
        }
        .reward-level-bar__full-right,
        .reward-level-bar__compact-right {
          justify-self: end;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        .reward-level-bar__compact-right {
          display: none;
          font-weight: 800;
        }
        @media ${compactRewardLevelQuery} {
          padding: 0.52rem 0.75rem;
          column-gap: 0.55rem;
          .reward-level-bar__full-left,
          .reward-level-bar__full-right {
            display: none;
          }
          .reward-level-bar__compact-left,
          .reward-level-bar__compact-right {
            display: inline-flex;
            align-items: center;
          }
        }
      `}`}
      style={style}
    >
      <div className="reward-level-bar__full-left">
        <span>{rewardLevelLabel}:</span>
        <span className="reward-level-bar__stars">{fullStars}</span>
      </div>
      <div className="reward-level-bar__compact-left">
        {compactStars}
      </div>
      <div className="reward-level-bar__full-right">{earnUpToLabel}</div>
      <div className="reward-level-bar__compact-right">{xpAmountLabel} XP</div>
    </div>
  );
}
