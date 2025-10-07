import React from 'react';
import { css } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';

export default React.forwardRef<
  HTMLButtonElement,
  {
    label: string;
    disabled: boolean;
    onToggle: () => void;
  }
>(({ label, disabled, onToggle }, ref) => {
  const buttonCls = css`
    cursor: ${disabled ? 'not-allowed' : 'pointer'};
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    color: #374151;
    font-weight: 700;
    font-size: 1.05rem;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    text-align: center;
    width: 100%;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    opacity: ${disabled ? 0.6 : 1};
    transition: all 0.15s ease;
    @media (hover: hover) and (pointer: fine) {
      &:hover {
        background: ${disabled ? '#f8fafc' : '#f1f5f9'};
        border-color: ${disabled ? '#e2e8f0' : '#3b82f6'};
      }
    }
    @media (max-width: ${tabletMaxWidth}) {
      font-size: 1.1rem;
      padding: 0.7rem 1rem;
    }
  `;
  return (
    <button ref={ref} className={buttonCls} onClick={onToggle}>
      <span>{label}</span>
      <span
        className={css`
          opacity: 0.7;
        `}
      >
        ▼
      </span>
    </button>
  );
});
