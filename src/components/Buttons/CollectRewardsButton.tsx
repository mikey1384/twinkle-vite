import React from 'react';
import Icon from '~/components/Icon';
import { useNotiContext } from '~/contexts';
import { css } from '@emotion/css';

export default function CollectRewardsButton({
  isChecked
}: {
  isChecked: boolean;
}) {
  const dailyRewardModalShown = useNotiContext(
    (v) => v.state.dailyRewardModalShown
  );
  const onSetDailyRewardModalShown = useNotiContext(
    (v) => v.actions.onSetDailyRewardModalShown
  );

  return (
    <button
      onClick={() => onSetDailyRewardModalShown(true)}
      disabled={dailyRewardModalShown}
      className={css`
        font-family: 'Poppins', sans-serif;
        position: relative;
        background-image: ${isChecked
          ? 'linear-gradient(45deg, #00b09b, #96c93d)'
          : 'linear-gradient(-45deg, #6a11cb, #2575fc, #ec008c, #fc6767)'};
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-weight: bold;
        font-size: 1.2rem;
        background-size: 200% auto;
        animation: ${dailyRewardModalShown || isChecked
          ? 'none'
          : 'colorShift 6s ease infinite, pulse 2s infinite'};
        opacity: ${dailyRewardModalShown ? 0.5 : 1};
        cursor: ${dailyRewardModalShown ? 'default' : 'pointer'};
        transition: background-position 0.5s ease, transform 0.3s ease,
          box-shadow 0.3s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

        &:before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          right: 2px;
          bottom: 2px;
          background: inherit;
          border-radius: 18px;
          filter: blur(6px);
          z-index: -1;
          opacity: 0.6;
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
          box-shadow: none;
        }

        ${isChecked
          ? `
            &:hover {
              background-position: right center;
              transform: scale(1.05);
              box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
            }
          `
          : ''}
      `}
    >
      {isChecked ? (
        <>
          Collected <Icon icon="check" style={{ marginLeft: '0.5rem' }} />
        </>
      ) : (
        'Collect Rewards'
      )}
    </button>
  );
}
