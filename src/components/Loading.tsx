import React, { CSSProperties } from 'react';
import Spinner from '~/components/Spinner';
import { css } from '@emotion/css';

export default function Loading({
  className,
  text = '',
  innerStyle = {},
  style = {},
  theme
}: {
  className?: string;
  text?: string;
  innerStyle?: CSSProperties;
  style?: CSSProperties;
  theme?: 'light' | 'dark';
}) {
  return (
    <div
      className={
        className ||
        css`
          height: 15rem;
          width: 100%;
        `
      }
      style={{ zIndex: 1000, ...style }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '2.8rem',
          ...innerStyle
        }}
      >
        <Spinner theme={theme} />
        {text && <div style={{ marginLeft: '1.5rem' }}>{text}</div>}
      </div>
    </div>
  );
}
