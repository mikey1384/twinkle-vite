import { css } from '@emotion/css';
import React from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';

interface PromptMessageProps {
  isSearching?: boolean;
}

export default function PromptMessage({ isSearching }: PromptMessageProps) {
  return (
    <div
      className={css`
        position: absolute;
        bottom: 2rem;
        left: 50%;
        transform: translate(-50%, 50%)
          translateY(${isSearching ? '1rem' : '0'});
        padding: 1rem 2rem;
        background: ${Color.white()};
        border-radius: 1rem;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 1rem;
        opacity: ${isSearching ? 0 : 1};
        transition: all 0.3s ease-in-out;
        z-index: 1;
        font-size: 1.7rem;

        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.3rem;
          padding: 0.7rem 1.5rem;
        }
      `}
    >
      <span style={{ color: Color.black() }}>Type a word below...</span>
      <Icon style={{ color: Color.black() }} icon="arrow-down" />
    </div>
  );
}
