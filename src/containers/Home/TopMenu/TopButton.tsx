import React from 'react';
import { borderRadius, tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';

export default function TopButton({
  colorLeft = '#7F7FD5',
  colorMiddle = '#86A8E7',
  colorRight = '#91EAE4',
  children,
  isAchieved,
  loading,
  disabled,
  onClick,
  style
}: {
  colorLeft?: string;
  colorMiddle?: string;
  colorRight?: string;
  children: React.ReactNode;
  isAchieved?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const buttonStyle = css`
    font-family: 'Poppins', sans-serif;
    cursor: ${disabled || loading ? 'default' : 'pointer'};
    display: flex;
    opacity: ${disabled || loading ? 0.5 : 1};
    background-image: linear-gradient(
      to right,
      ${colorLeft} 0%,
      ${colorMiddle} 51%,
      ${colorRight} 100%
    );
    position: relative;
    overflow: hidden;
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
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(0);

    &:before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      transition: 0.5s;
    }

    &:hover {
      background-position: right center;
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    @media (max-width: ${tabletMaxWidth}) {
      font-size: 1.2rem;
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
      {isAchieved ? (
        <Icon style={{ marginLeft: '0.5rem' }} icon="check" />
      ) : null}
    </button>
  );
}
