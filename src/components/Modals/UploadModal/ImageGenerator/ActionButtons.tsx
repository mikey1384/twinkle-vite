import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

interface ActionButtonsProps {
  onUseImage: () => void;
  showFollowUp: boolean;
}

export default function ActionButtons({
  onUseImage,
  showFollowUp
}: ActionButtonsProps) {
  return (
    <div
      className={css`
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        align-items: center;
        ${showFollowUp
          ? ''
          : `border-top: 1px solid ${Color.borderGray()}; padding-top: 1.5rem; margin-top: -0.5rem;`}
      `}
    >
      <button
        onClick={onUseImage}
        className={css`
          padding: 0.875rem 2rem;
          background: ${Color.green()};
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.15);
          }
        `}
      >
        Use This Image
      </button>
    </div>
  );
}