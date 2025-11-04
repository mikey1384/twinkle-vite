import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { Color, borderRadius } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import localize from '~/constants/localize';
import { useRoleColor } from '~/theme/useRoleColor';
import { isMobile, isTablet } from '~/helpers';

const rewardLevelLabel = localize('effortLevel');

export default function RewardLevelBar({
  className,
  rewardLevel,
  style
}: {
  className?: string;
  rewardLevel: number;
  style?: React.CSSProperties;
}) {
  const deviceIsMobile = isMobile(navigator);
  const deviceIsTablet = isTablet(navigator);
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

  const leftStars = useMemo(() => {
    if (deviceIsMobile || deviceIsTablet) {
      return `${rewardLevel}-STAR`;
    }
    return Array.from({ length: rewardLevel }, (_, i) => (
      <Icon
        key={i}
        icon="star"
        style={{
          marginLeft: '0.25rem',
          fontSize: '1.4em',
          color: starColor
        }}
      />
    ));
  }, [deviceIsMobile, deviceIsTablet, rewardLevel, starColor]);

  const earnUpToLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `최대 ${addCommasToNumber(rewardLevel * 2000)}XP 까지 획득가능`;
    }
    return `Earn up to ${addCommasToNumber(rewardLevel * 2000)} XP`;
  }, [rewardLevel]);

  return (
    <div
      className={`${className || ''} ${css`
        background: ${themedBg};
        color: #fff;
        padding: 0.6rem 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
        border: none;
        border-radius: ${borderRadius};
        font-weight: 600;
        width: auto;
        max-width: 100%;
        .left {
          display: flex;
          align-items: center;
          min-width: 0;
        }
        .right {
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}`}
      style={style}
    >
      <div className="left">
        {rewardLevelLabel}: {leftStars}
      </div>
      <div className="right">{earnUpToLabel}</div>
    </div>
  );
}
