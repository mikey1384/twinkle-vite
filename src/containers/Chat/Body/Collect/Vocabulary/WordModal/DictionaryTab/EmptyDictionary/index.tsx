import React, { useState } from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import BonusRoulette from './BonusRoulette';
import { useKeyContext } from '~/contexts/hooks';
import Icon from '~/components/Icon';

export default function EmptyDictionary({ word }: { word: string }) {
  const [showRoulette, setShowRoulette] = useState(false);
  const { twinkleCoins } = useKeyContext((v) => v.myState);

  return (
    <div
      className={css`
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 150px;
        width: 100%;
        flex-direction: column;
      `}
    >
      {!showRoulette ? (
        <button
          className={css`
            padding: 1.5rem 3rem;
            font-size: 1.5rem;
            font-weight: bold;
            color: white;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            background: linear-gradient(
              45deg,
              #ffd700,
              #ff69b4,
              #9370db,
              #4169e1
            );
            background-size: 300% 300%;
            animation: gradient 5s ease infinite;
            transition: all 0.3s ease;

            @keyframes gradient {
              0% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
              100% {
                background-position: 0% 50%;
              }
            }

            &:disabled {
              cursor: not-allowed;
              opacity: 0.7;
              background: #808080;
              transform: none;
              animation: none;
            }

            &:not(:disabled) {
              &:hover {
                transform: translateY(-2px);
                box-shadow: 0 7px 14px rgba(0, 0, 0, 0.2);
              }
            }

            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.2rem;
              padding: 1.2rem 2.4rem;
            }
          `}
          onClick={() => setShowRoulette(true)}
          disabled={twinkleCoins < 500}
        >
          Bonus Chance (<Icon icon={['far', 'badge-dollar']} /> 500)
        </button>
      ) : (
        <BonusRoulette word={word} />
      )}
    </div>
  );
}
