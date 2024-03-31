import React from 'react';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function TargetSubject({
  subject
}: {
  subject: { content: string };
}) {
  return (
    <div
      className={css`
        margin-top: 0.5rem;
        margin-bottom: 1rem;
        padding: 1rem;
        border: 1px solid ${Color.lightGray()};
        background: ${Color.wellGray()};
        display: flex;
        justify-content: space-between;
        border-radius: ${borderRadius};
        width: 85%;
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
    >
      <div
        className={css`
          width: 100%;
          font-weight: bold;
        `}
      >
        {subject.content}
      </div>
    </div>
  );
}
