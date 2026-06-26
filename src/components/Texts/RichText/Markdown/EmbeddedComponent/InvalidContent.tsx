import React from 'react';
import { borderRadius } from '~/constants/css';
import { css, cx } from '@emotion/css';

export default function InvalidContent({
  bare,
  style
}: {
  bare?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cx(invalidContentClass, bare && 'bare')}
    >
      Invalid Content
    </div>
  );
}

const invalidContentClass = css`
  font-weight: bold;
  text-align: center;
  padding: 1.5rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};

  &.bare {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 1rem;
    border: 0;
    border-radius: 0;
  }
`;
