import React from 'react';
import { css, keyframes } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(255, 215, 0, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
  }
`;

export default function EmptyDictionary() {
  return (
    <div
      className={css`
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 150px;
        width: 100%;
      `}
    >
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
          animation: ${pulse} 2s infinite, gradient 5s ease infinite;
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

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 7px 14px rgba(0, 0, 0, 0.2);
          }

          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.2rem;
            padding: 1.2rem 2.4rem;
          }
        `}
        onClick={() => console.log('Bonus chance clicked!')}
      >
        Bonus Chance
      </button>
    </div>
  );
}
