import React from 'react';
import { Color, borderRadius } from '~/constants/css';
import { css } from '@emotion/css';

export default function InvalidContent({
  style
}: {
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={css`
        font-weight: bold;
        text-align: center;
        padding: 1.5rem;
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
      `}
    >
      Invalid Content
    </div>
  );
}
