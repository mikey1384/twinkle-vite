import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

interface UseThisImageButtonProps {
  onUseImage: () => void;
  showFollowUp: boolean;
}

export default function UseThisImageButton({
  onUseImage,
  showFollowUp
}: UseThisImageButtonProps) {
  return (
    <div
      className={css`
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        ${showFollowUp
          ? 'border-top: 1px solid ' +
            Color.borderGray() +
            '; padding-top: 1.5rem; margin-top: 1rem;'
          : 'border-top: 1px solid ' +
            Color.borderGray() +
            '; padding-top: 1.5rem; margin-top: -0.5rem;'}
      `}
    >
      <button
        onClick={onUseImage}
        className={css`
          padding: 1rem 3rem;
          background: ${Color.green()};
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          min-width: 200px;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            background: ${Color.green(0.9)};
          }

          &:active {
            transform: translateY(-1px);
          }
        `}
      >
        Use This Image
      </button>
    </div>
  );
}
