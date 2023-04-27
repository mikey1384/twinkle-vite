import React from 'react';
import { borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

export default function TopButton({
  colorLeft = '#f6d365',
  colorMiddle = '#fda085',
  colorRight = '#f6d365',
  children,
  loading,
  disabled,
  onClick,
  style
}: {
  colorLeft?: string;
  colorMiddle?: string;
  colorRight?: string;
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const buttonStyle = css`
    font-family: 'Ubuntu', sans-serif, Arial, Helvetica;
    cursor: ${disabled || loading ? 'default' : 'pointer'};
    display: flex;
    opacity: ${disabled || loading ? 0.5 : 1};
    background-image: linear-gradient(
      to right,
      ${colorLeft} 0%,
      ${colorMiddle} 51%,
      ${colorRight} 100%
    );
    &:hover {
      background-position: right center;
    }
    transition: 0.5s;
    background-size: 200% auto;
    color: #fff;
    justify-content: center;
    align-items: center;
    text-align: center;
    font-weight: bold;
    font-size: 1.5rem;
    border-radius: ${borderRadius};
    border: none;
    padding: 1rem;
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1.3rem;
    }
  `;
  return (
    <button
      disabled={disabled || loading}
      style={style}
      onClick={onClick}
      className={buttonStyle}
    >
      {loading && (
        <Icon style={{ marginRight: '0.7rem' }} icon="spinner" pulse />
      )}
      {children}
    </button>
  );
}
