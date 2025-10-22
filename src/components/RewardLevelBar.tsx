import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { Color, wideBorderRadius } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import localize from '~/constants/localize';
import { useRoleColor } from '~/theme/useRoleColor';

const rewardLevelLabel = localize('rewardLevel');

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
  const starColor = 'var(--perfect-star-color, #ffd700)';
  const stars = useMemo(() => {
    return Array.from({ length: rewardLevel }, (_, i) => (
      <Icon
        key={i}
        icon="star"
        style={{
          marginLeft: '0.25rem',
          fontSize: '1.6rem',
          color: starColor
        }}
      />
    ));
  }, [rewardLevel, starColor]);

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
        border: none;
        border-radius: ${wideBorderRadius};
        font-weight: 600;
        width: auto;
        max-width: 100%;
      `}`}
      style={style}
    >
      <div>
        {rewardLevelLabel}: {stars}
      </div>
      <div>{earnUpToLabel}</div>
    </div>
  );
}
