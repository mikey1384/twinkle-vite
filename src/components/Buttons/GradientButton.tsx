import React from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth, borderRadius } from '~/constants/css';

export default function GradientButton({
  theme = 'default',
  isFlat,
  disabled,
  onClick,
  children = null,
  fontSize = '2.5rem',
  mobileFontSize = '2rem',
  loading,
  style
}: {
  theme?: 'default' | 'blue' | 'purple' | 'pink' | 'orange' | 'gold';
  isFlat?: boolean;
  disabled?: boolean;
  onClick: () => any;
  children?: React.ReactNode;
  fontSize?: string;
  mobileFontSize?: string;
  loading?: boolean;
  style?: React.CSSProperties;
}) {
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
        background: ${getGradientColors()};
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

  function getGradientColors() {
    switch (theme) {
      case 'blue':
        return `linear-gradient(
        -45deg,
        ${Color.blue()},
        ${Color.lightBlue()},
        ${Color.darkBlue()},
        ${Color.oceanBlue()}
      )`;
      case 'purple':
        return `linear-gradient(
        -45deg,
        ${Color.purple()},
        ${Color.lavender()},
        ${Color.darkPurple()},
        ${Color.darkPurple()}
      )`;
      case 'pink':
        return `linear-gradient(
        -45deg,
        ${Color.pink()},
        ${Color.pastelPink()},
        ${Color.strongPink()},
        ${Color.cranberry()}
      )`;
      case 'orange':
        return `linear-gradient(
        -45deg,
        ${Color.orange()},
        ${Color.lightOrange()},
        ${Color.redOrange()},
        ${Color.goldOrange()}
      )`;
      case 'gold':
        return `linear-gradient(
        -45deg,
        ${Color.yellow()},
        ${Color.darkGold()},
        ${Color.gold()},
        ${Color.redOrange()}
      )`;
      default:
        return `linear-gradient(
        -45deg,
        ${Color.redOrange()},
        ${Color.rose()},
        ${Color.oceanGreen()},
        ${Color.limeGreen()}
      )`;
    }
  }
}
