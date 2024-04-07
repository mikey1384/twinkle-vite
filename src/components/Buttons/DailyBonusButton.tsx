import React from 'react';
import { css } from '@emotion/css';
import { useNotiContext } from '~/contexts';

export default function DailyBonusButton() {
  const dailyBonusModalShown = useNotiContext(
    (v) => v.state.dailyBonusModalShown
  );
  const onSetDailyBonusModalShown = useNotiContext(
    (v) => v.actions.onSetDailyBonusModalShown
  );

  return (
    <button
      onClick={() => onSetDailyBonusModalShown(true)}
      disabled={dailyBonusModalShown}
      className={css`
        font-family: 'Poppins', sans-serif;
        background-image: linear-gradient(
          45deg,
          #006d75 0%,
          #00b0ff 50%,
          #006d75 100%
        );
        background-size: 400% 400%;
        animation: ${dailyBonusModalShown
          ? 'none'
          : 'colorShift 6s ease infinite, pulse 2s infinite'};
        opacity: ${dailyBonusModalShown ? 0.5 : 1};
        cursor: ${dailyBonusModalShown ? 'default' : 'pointer'};
        color: #fff;
        padding: 12px 24px;
        border: none;
        border-radius: 25px;
        font-weight: bold;
        font-size: 1.3rem;
        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s ease-in-out;

        &:hover {
          transform: translateY(-2px);
        }

        &:active {
          transform: translateY(1px);
        }

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
      `}
    >
      Bonus!
    </button>
  );
}
