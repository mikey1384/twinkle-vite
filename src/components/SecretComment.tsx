import React, { useEffect } from 'react';
import { borderRadius, Color, desktopMinWidth } from '~/constants/css';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const submitYourResponseLabel = localize('submitYourResponse2');

export default function SecretComment({
  onClick,
  onMount,
  style
}: {
  onClick?: () => void;
  onMount?: () => void;
  style?: React.CSSProperties;
}) {
  useEffect(() => {
    onMount?.();
  }, [onMount]);

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
      {submitYourResponseLabel}
    </div>
  );
}
