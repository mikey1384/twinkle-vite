import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';

export default function GoToBottomButton({
  theme,
  onClick
}: {
  theme: string;
  onClick: () => void;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  return (
    <button
      className={css`
        background-color: ${Color[theme || profileTheme](0.6)};
        border: none;
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        color: #ffffff;
        cursor: pointer;
        height: 40px;
        outline: none;
        padding: 8px;
        transition: all 0.3s ease;
        width: 40px;
        &:hover {
          background-color: ${Color[theme || profileTheme]()};
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }
        &:active {
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
          transform: translateY(0);
        }
        > svg {
          height: 24px;
          width: 24px;
        }
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        &:hover {
          > svg {
            animation: bounce 0.5s ease infinite;
          }
        }
      `}
      onClick={onClick}
      aria-label="Go to bottom"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
  );
}
