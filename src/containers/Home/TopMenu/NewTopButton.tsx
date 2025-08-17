import React from 'react';
import { css } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';

export default function NewTopButton({
  onClick,
  loading,
  children,
  variant = 'slate',
  style
}: {
  onClick: () => void;
  loading?: boolean;
  children: React.ReactNode;
  variant?: 'slate' | 'magenta' | 'purple' | 'orange';
  style?: React.CSSProperties;
}) {
  const styles =
    variant === 'magenta'
      ? magentaStyles
      : variant === 'purple'
      ? purpleStyles
      : variant === 'orange'
      ? orangeStyles
      : slateStyles;

  return (
    <button
      disabled={!!loading}
      onClick={onClick}
      style={style}
      className={css`
        cursor: ${loading ? 'default' : 'pointer'};
        display: flex;
        opacity: ${loading ? 0.5 : 1};
        ${styles.base}
        justify-content: center;
        align-items: center;
        text-align: center;
        font-weight: 600;
        font-size: 1.5rem;
        border-radius: 6px;
        padding: 1rem 1.3rem;
        gap: 0.5rem;
        transition: all 0.15s ease;

        &:hover:not(:disabled) {
          ${styles.hover}
          transform: translateY(1px);
          ${styles.hoverShadow}
        }

        &:active:not(:disabled) {
          ${styles.active}
          transform: translateY(2px);
          box-shadow: none;
        }

        @media (max-width: ${tabletMaxWidth}) {
          font-size: 1.2rem;
          padding: 0.875rem 1.1rem;
        }
      `}
    >
      {children}
    </button>
  );
}

const slateStyles = {
  base: 'background: #64748b; border: 2px solid #475569; color: white; box-shadow: 0 2px 0 #334155;',
  hover: 'background: #5a6b82;',
  hoverShadow: 'box-shadow: 0 1px 0 #334155;',
  active: 'background: #334155;'
};

const magentaStyles = {
  base: 'background: linear-gradient(135deg, #db0076 0%, #ff4088 100%); border: 2px solid #b00063; color: white; box-shadow: 0 2px 0 #8a004e;',
  hover: 'background: linear-gradient(135deg, #b80069 0%, #ff2578 100%);',
  hoverShadow: 'box-shadow: 0 1px 0 #8a004e;',
  active: 'background: linear-gradient(135deg, #8a004e 0%, #e0006d 100%);'
};

const purpleStyles = {
  base: 'background: linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%); border: 2px solid #5B21B6; color: white; box-shadow: 0 2px 0 #4C1D95;',
  hover: 'background: linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%);',
  hoverShadow: 'box-shadow: 0 1px 0 #4C1D95;',
  active: 'background: linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%);'
};

const orangeStyles = {
  base: 'background: #f59e0b; border: 2px solid #d97706; color: white; box-shadow: 0 2px 0 #b45309;',
  hover: 'background: #d97706;',
  hoverShadow: 'box-shadow: 0 1px 0 #b45309;',
  active: 'background: #b45309;'
};
