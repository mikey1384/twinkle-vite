import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

interface TabButtonProps {
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
}

export default function TabButton({ onClick, active, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={active}
      className={css`
        padding: 0.75rem 1.5rem;
        background: ${active ? Color.logoBlue() : Color.white()};
        color: ${active ? '#ffffff' : Color.darkGray()};
        border: 2px solid ${active ? Color.logoBlue() : Color.borderGray()};
        border-radius: 12px;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: ${active ? 'default' : 'pointer'};
        transition: all 0.2s ease;
        min-width: 120px;
        position: relative;
        overflow: hidden;

        &:hover:not(:disabled) {
          background: ${Color.highlightGray()};
          border-color: ${Color.logoBlue(0.5)};
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        &:disabled {
          cursor: default;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.2);
        }

        @media (max-width: 768px) {
          padding: 0.6rem 1rem;
          font-size: 0.85rem;
          min-width: 100px;
        }
      `}
    >
      {children}
    </button>
  );
}