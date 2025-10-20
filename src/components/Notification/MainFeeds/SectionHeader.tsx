import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function SectionHeader({ label }: { label: string }) {
  return (
    <div
      className={css`
        width: 100%;
        display: flex;
        align-items: center;
        margin: 1.2rem 0 0.8rem;
      `}
    >
      <span
        className={css`
          font-size: 1.2rem;
          font-weight: 700;
          color: ${Color.darkGray()};
          background: ${Color.white()};
          border: 1px solid var(--ui-border);
          border-radius: 9999px;
          padding: 0.3rem 0.8rem;
        `}
      >
        {label}
      </span>
      <div
        className={css`
          flex: 1;
          height: 1px;
          background: var(--ui-border);
          margin-left: 0.8rem;
        `}
      />
    </div>
  );
}
