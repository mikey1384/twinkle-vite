import React, { useMemo } from 'react';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

export default function TwinkleLogo({
  style
}: {
  style?: React.CSSProperties;
}) {
  const { logoTwin, logoKle } = useKeyContext((v) => v.theme);
  const twinColor = useMemo(() => Color[logoTwin.color](), [logoTwin]);
  const kleColor = useMemo(() => Color[logoKle.color](), [logoKle]);

  return (
    <div
      style={style}
      className={`desktop ${css`
        cursor: pointer;
        position: relative;
        width: 10rem;
        height: 2rem;
      `}`}
      onClick={() => {
        window.location.href = '/';
      }}
    >
      <div
        onClick={() => {
          const appElement = document.getElementById('App');
          if (appElement) appElement.scrollTop = 0;
        }}
        className={css`
          font-size: 2rem;
          font-weight: bold;
          font-family: 'Ubuntu', sans-serif;
          line-height: 0.9;
          letter-spacing: -0.02em;
          color: ${Color.gray()};
          transition: all 0.2s ease-in-out;

          &:hover {
            transform: scale(1.03);
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.12);
          }

          > .logo {
            line-height: 1;
            display: inline-block;
          }
          > .logo-twin {
            color: ${twinColor};
          }
          > .logo-kle {
            color: ${kleColor};
          }
        `}
      >
        <span className="logo logo-twin">Twin</span>
        <span className="logo logo-kle">kle</span>
      </div>
    </div>
  );
}
