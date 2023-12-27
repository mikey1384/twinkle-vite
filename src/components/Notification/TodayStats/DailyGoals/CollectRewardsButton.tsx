import React from 'react';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

export default function CollectRewardsButton({
  isChecked,
  onClick,
  dailyRewardModalShown
}: {
  isChecked: boolean;
  onClick: () => void;
  dailyRewardModalShown: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={dailyRewardModalShown}
      className={css`
        background-image: ${isChecked
          ? 'none'
          : 'linear-gradient(-45deg, #6a11cb, #2575fc, #ec008c, #fc6767)'};
        background-color: ${isChecked ? Color.green() : 'transparent'};
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1.2rem;
        background-size: 400% 400%;
        animation: ${dailyRewardModalShown || isChecked
          ? 'none'
          : 'colorShift 6s ease infinite, pulse 2s infinite'};
        opacity: ${dailyRewardModalShown ? 0.5 : 1};
        cursor: ${dailyRewardModalShown ? 'default' : 'pointer'};

        @keyframes colorShift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.07);
          }
        }

        &:disabled {
          background-image: none;
          background-color: #ccc;
        }

        ${isChecked
          ? `&:hover {
                text-decoration: underline;
              }`
          : ''}
      `}
    >
      {isChecked ? 'Collected' : 'Collect Rewards'}
    </button>
  );
}
