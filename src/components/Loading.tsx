import React, { CSSProperties } from 'react';
import Spinner from '~/components/Spinner';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';

const defaultLoadingClass = css`
  height: 15rem;
  width: 100%;
`;

const statusSurfaceClass = css`
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  max-width: min(100%, 42rem);
  padding: 0.8rem 1.2rem 0.8rem 0.8rem;
  border: 1px solid ${Color.logoBlue(0.2)};
  border-radius: 999px;
  background-color: ${Color.white(0.96)};
  box-shadow: 0 0.8rem 2.4rem ${Color.black(0.08)};
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
  line-height: 1.35;
  text-align: left;
  overflow-wrap: anywhere;
`;

const statusSpinnerClass = css`
  display: grid;
  flex: 0 0 3.6rem;
  width: 3.6rem;
  height: 3.6rem;
  place-items: center;
  border-radius: 50%;
  background-color: ${Color.logoBlue(0.1)};
`;

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
  theme?: string;
}) {
  const statusLabel = text || 'Loading';

  return (
    <div
      aria-busy="true"
      aria-label={text ? statusLabel : undefined}
      aria-live={text ? 'polite' : undefined}
      className={className || defaultLoadingClass}
      role={text ? 'status' : undefined}
      style={{
        zIndex: 1000,
        ...(text
          ? { color: Color.blackGray(), fontWeight: 600 }
          : undefined),
        ...style
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: text ? '1.3rem' : '2.8rem',
          ...innerStyle
        }}
      >
        {text ? (
          <div className={statusSurfaceClass}>
            <span className={statusSpinnerClass}>
              <Spinner size={20} theme={theme} />
            </span>
            <span>{text}</span>
          </div>
        ) : (
          <Spinner theme={theme} />
        )}
      </div>
    </div>
  );
}
