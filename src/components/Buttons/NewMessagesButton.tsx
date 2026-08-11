import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';

export default function NewMessagesButton({
  count,
  theme,
  onClick
}: {
  count: number;
  theme: string;
  onClick: () => void;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const label = count > 1 ? `New Messages (${count})` : 'New Message';
  return (
    <button
      className={css`
        align-items: center;
        background-color: ${Color[theme || profileTheme]()};
        border: none;
        border-radius: 999px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        color: #ffffff;
        cursor: pointer;
        display: flex;
        font-family: inherit;
        font-size: 1.1rem;
        font-weight: 700;
        gap: 0.6rem;
        outline: none;
        padding: 0.7rem 1.4rem;
        transition: all 0.3s ease;
        @keyframes newMessagesPopIn {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        animation: newMessagesPopIn 0.25s ease;
        @media (hover: hover) and (pointer: fine) {
          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transform: translateY(-2px);
          }
        }
        &:active {
          box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
          transform: translateY(0);
        }
        > svg {
          height: 1.4rem;
          width: 1.4rem;
        }
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      `}
      onClick={onClick}
      aria-label={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
      {label}
    </button>
  );
}
