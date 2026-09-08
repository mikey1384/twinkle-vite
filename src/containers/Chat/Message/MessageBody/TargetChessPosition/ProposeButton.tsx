import React from 'react';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function ProposeButton({
  label,
  onClick,
  style
}: {
  label: string;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      style={{
        border: `1px solid ${Color.black()}`,
        background: '#fff',
        ...style
      }}
      className={`unselectable ${css`
        cursor: pointer;
        opacity: 0.8;
        padding: 1rem;
        min-height: 44px;
        max-width: 100%;
        font: inherit;
        border-radius: 6px;
        overflow-wrap: anywhere;
        text-align: center;
        &:focus-visible {
          outline: 3px solid #334155;
          outline-offset: 2px;
        }
        color: ${Color.black()};
        &:hover {
          opacity: 1;
          color: ${Color.vantaBlack()};
        }
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0.7rem;
        }
      `}`}
      onClick={onClick}
    >
      <span
        className={css`
          font-size: 14px;
          font-weight: bold;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 14px;
          }
        `}
      >
        <Icon icon="clock-rotate-left" />
        <span style={{ marginLeft: '1rem' }}>{label}</span>
      </span>
    </button>
  );
}
