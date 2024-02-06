import React from 'react';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { rewardReasons } from '~/constants/defaultValues';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function RewardMessage({
  rewardReason,
  rewardAmount
}: {
  rewardReason: number;
  rewardAmount: number;
}) {
  return (
    <div
      className={css`
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.2rem;
        }
      `}
      style={{
        display: 'inline-block',
        width: 'auto',
        borderRadius,
        padding: '1rem',
        background: Color[rewardReasons[rewardReason].color](),
        color: '#fff'
      }}
    >
      <Icon icon={rewardReasons[rewardReason].icon} />
      <span style={{ marginLeft: '1rem' }}>
        Rewarded {addCommasToNumber(rewardAmount)} XP{' '}
        {rewardReasons[rewardReason].message}
      </span>
    </div>
  );
}
