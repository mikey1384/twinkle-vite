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
    <div
      style={{
        border: `1px solid ${Color.black()}`,
        background: '#fff',
        ...style
      }}
      className={`unselectable ${css`
        cursor: pointer;
        opacity: 0.8;
        padding: 1rem;
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
          font-size: 1.7rem;
          font-weight: bold;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.3rem;
          }
        `}
      >
        <Icon icon="clock-rotate-left" />
        <span style={{ marginLeft: '1rem' }}>{label}</span>
      </span>
    </div>
  );
}
