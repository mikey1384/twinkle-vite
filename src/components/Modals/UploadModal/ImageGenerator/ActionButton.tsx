import React from 'react';
import { css } from '@emotion/css';

interface ActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  className?: string;
}

export default function ActionButton({
  onClick,
  disabled,
  children,
  variant = 'primary',
  fullWidth = false,
  className = ''
}: ActionButtonProps) {
  const primaryColor = '#007bff';
  const primaryHoverColor = '#0056b3';
  const secondaryColor = 'rgba(255,140,0,1)';
  const disabledColor = '#b0b0b0';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={css`
        padding: 0.75rem 1.5rem;
        background: ${disabled
          ? disabledColor
          : variant === 'primary'
          ? primaryColor
          : secondaryColor};
        color: #ffffff;
        border: none;
        border-radius: 12px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: ${disabled ? 'not-allowed' : 'pointer'};
        transition: all 0.2s ease;
        box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
        opacity: ${disabled ? '0.5' : '1'};
        ${fullWidth ? 'width: 100%;' : ''}

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
          background: ${variant === 'primary' ? primaryHoverColor : secondaryColor};
        }

        &:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
        }

        @media (min-width: 768px) {
          padding: 0.875rem 1.75rem;
          font-size: 1rem;
          ${fullWidth ? '' : 'min-width: 130px;'}
        }

        ${className}
      `}
    >
      {children}
    </button>
  );
}