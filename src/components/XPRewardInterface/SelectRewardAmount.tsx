import React from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

const rewardAmountPickerClass = css`
  padding: 1.5rem;
  display: flex;
  width: 100%;
  font-size: 3rem;
  justify-content: center;
  align-items: center;

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 2rem;
  }
`;

const rewardAmountMarkClass = css`
  cursor: pointer;
  margin-left: 0.5rem;
  color: ${Color.black()};
`;

const glowingRewardAmountMarkClass = css`
  animation: rewardAmountMarkGlow 1.6s ease-out 1;

  @keyframes rewardAmountMarkGlow {
    0% {
      color: ${Color.strongPink()};
    }

    45% {
      color: ${Color.pink(0.82)};
    }

    100% {
      color: ${Color.black()};
    }
  }
`;

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
    <div className={rewardAmountPickerClass}>
      {Array(rewardables)
        .fill(null)
        .map((elem, index) => {
          return (
            <Icon
              key={index}
              icon={
                selectedAmount > index ? 'certificate' : ['far', 'certificate']
              }
              className={`${rewardAmountMarkClass} ${glowingRewardAmountMarkClass}`}
              onClick={() => onSetSelectedAmount(index + 1)}
            />
          );
        })}
    </div>
  );
}
