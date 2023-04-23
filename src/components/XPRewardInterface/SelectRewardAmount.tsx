import React from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function SelectRewardAmount({
  selectedAmount,
  onSetSelectedAmount,
  rewardables
}: {
  selectedAmount: number;
  onSetSelectedAmount: (index: number) => void;
  rewardables: number;
}) {
  return (
    <div
      className={css`
        padding: 1.5rem;
        display: flex;
        width: 100%;
        font-size: 3rem;
        justify-content: center;
        align-items: center;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 2rem;
        }
      `}
    >
      {Array(rewardables)
        .fill(null)
        .map((elem, index) => (
          <Icon
            key={index}
            icon={
              selectedAmount > index ? 'certificate' : ['far', 'certificate']
            }
            style={{ cursor: 'pointer', marginLeft: '0.5rem' }}
            onClick={() => onSetSelectedAmount(index + 1)}
          />
        ))}
    </div>
  );
}
