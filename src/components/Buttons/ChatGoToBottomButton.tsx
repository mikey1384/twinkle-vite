import React from 'react';
import { css, cx } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import { chatScrollButtonClass, chatScrollButtonStyle } from './chatScrollButtonStyles';

export default function ChatGoToBottomButton({
  theme,
  onClick
}: {
  theme: string;
  onClick: () => void;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  return (
    <button
      type="button"
      style={chatScrollButtonStyle(theme || profileTheme)}
      className={cx(chatScrollButtonClass, css`
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        height: 44px;
        padding: 8px;
        transition: all 0.3s ease;
        width: 44px;
        @media (hover: hover) and (pointer: fine) {
          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
          }
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
        @media (hover: hover) and (pointer: fine) {
          &:hover {
            > svg {
              animation: bounce 0.5s ease infinite;
            }
          }
        }
      `)}
      onClick={onClick}
      aria-label="Go to bottom"
    >
      <svg
        aria-hidden="true"
        focusable="false"
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
