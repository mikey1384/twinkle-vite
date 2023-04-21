import React from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth, borderRadius } from '~/constants/css';

interface Props {
  isFlat?: boolean;
  disabled?: boolean;
  onClick?: (arg: any) => any;
  children?: any;
  fontSize?: string;
  mobileFontSize?: string;
  loading?: boolean;
  style?: any;
}
export default function GradientButton({
  isFlat,
  disabled,
  onClick,
  children = null,
  fontSize = '2.5rem',
  mobileFontSize = '2rem',
  loading,
  style
}: Props) {
  return (
    <button
      style={style}
      className={css`
        ${disabled || loading ? `opacity: 0.5;` : ''}
        color: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        border: none;
        cursor: ${disabled || loading ? 'default' : 'pointer'};
        padding: 1.5rem;
        overflow: visible;
        pointer-events: auto;
        ${isFlat ? '' : `border-radius: ${borderRadius};`}
        color: white;
        font-family: 'Ubuntu', sans-serif, Arial, Helvetica;
        text-transform: uppercase;
        font-weight: bold;
        font-size: ${fontSize};
        box-shadow: rgb(0 0 0 / 15%) 0 1px 2px;
        background: linear-gradient(
          -45deg,
          ${Color.redOrange()},
          ${Color.rose()},
          ${Color.oceanGreen()},
          ${Color.limeGreen()}
        );
        background-size: 400% 400%;
        animation: Gradient 5s ease infinite;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: ${mobileFontSize};
        }
      `}
      onClick={onClick}
      disabled={!!loading || !!disabled}
    >
      {children}
      {loading && (
        <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
      )}
    </button>
  );
}
