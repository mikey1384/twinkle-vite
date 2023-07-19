import React from 'react';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';

export default function UserLevelStatus({
  style
}: {
  style?: React.CSSProperties;
}) {
  const { authLevel } = useKeyContext((v) => v.myState);
  return (
    <div
      className={css`
        background: #fff;
        padding: 1rem;
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
          border-left: 0;
          border-right: 0;
        }
      `}
      style={style}
    >
      <p
        className={css`
          font-weight: bold;
          font-size: 2.2rem;
        `}
      >
        Your User Level: {authLevel}
      </p>
    </div>
  );
}
