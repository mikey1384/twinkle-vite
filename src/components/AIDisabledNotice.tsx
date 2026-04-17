import React from 'react';
import { css } from '@emotion/css';
import { useViewContext } from '~/contexts';

export default function AIDisabledNotice({
  title = 'AI Features Unavailable',
  notice,
  style
}: {
  title?: string;
  notice?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const aiDisabledNotice = useViewContext((v) => v.state.aiDisabledNotice);
  const displayedNotice = notice ?? aiDisabledNotice;

  return (
    <div
      style={style}
      className={css`
        width: 100%;
        padding: 1rem 1.1rem;
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.32);
        background: rgba(148, 163, 184, 0.12);
        color: var(--chat-text);
      `}
    >
      <div
        className={css`
          font-weight: 800;
          margin-bottom: 0.35rem;
        `}
      >
        {title}
      </div>
      <div
        className={css`
          line-height: 1.5;
          opacity: 0.86;
        `}
      >
        {displayedNotice}
      </div>
    </div>
  );
}
