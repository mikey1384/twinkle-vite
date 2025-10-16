import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { rewardReasons } from '~/constants/defaultValues';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function RewardMessage({
  rewardReason,
  rewardAmount
}: {
  rewardReason: number;
  rewardAmount: number;
}) {
  const colorKey = rewardReasons[rewardReason].color;
  const bg = useMemo(() => Color[colorKey](0.14), [colorKey]);
  const border = useMemo(() => Color[colorKey](0.28), [colorKey]);
  const iconColor = useMemo(() => Color[colorKey](), [colorKey]);

  return (
    <div
      className={css`
        display: inline-flex;
        align-items: center;
        max-width: 100%;
        padding: 0.6rem 1rem;
        border-radius: 9999px;
        background: ${bg};
        border: 1px solid ${border};
        color: ${Color.darkGray()};
        font-weight: 600;
        line-height: 1.2;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.2rem;
          padding: 0.5rem 0.9rem;
        }
      `}
    >
      <Icon icon={rewardReasons[rewardReason].icon} style={{ color: iconColor }} />
      <span
        className={css`
          margin-left: 0.7rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `}
      >
        <strong style={{ fontWeight: 800 }}>Rewarded {addCommasToNumber(rewardAmount)} XP</strong>{' '}
        {rewardReasons[rewardReason].message}
      </span>
    </div>
  );
}
