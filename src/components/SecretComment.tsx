import React from 'react';
import { borderRadius, Color, desktopMinWidth } from '~/constants/css';
import { css } from '@emotion/css';
const submitYourResponseLabel = 'Submit your response to view this comment';

export default function SecretComment({
  label = submitYourResponseLabel,
  onClick,
  style
}: {
  label?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '1rem',
        borderRadius,
        background: Color.white(),
        border: `1px solid ${Color.black()}`,
        fontSize: '1.7rem',
        cursor: 'pointer',
        ...style
      }}
      className={css`
        @media (min-width: ${desktopMinWidth}) {
          &:hover {
            text-decoration: underline;
          }
        }
      `}
      onClick={onClick}
    >
      {label}
    </div>
  );
}
