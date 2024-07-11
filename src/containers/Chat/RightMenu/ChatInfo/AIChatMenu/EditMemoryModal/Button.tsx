import React from 'react';
import { css } from '@emotion/css';

export default function Button({
  onClick,
  children,
  transparent,
  color,
  disabled,
  style
}: {
  onClick: () => void;
  children: any;
  transparent?: boolean;
  color?: string;
  disabled?: boolean;
  style?: any;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={css`
        background-color: ${transparent ? 'transparent' : color || '#007bff'};
        border: none;
        color: ${transparent ? color || '#007bff' : '#fff'};
        padding: 0.5rem 1rem;
        cursor: ${disabled ? 'not-allowed' : 'pointer'};
        &:hover {
          opacity: 0.8;
        }
      `}
      style={style}
    >
      {children}
    </button>
  );
}
