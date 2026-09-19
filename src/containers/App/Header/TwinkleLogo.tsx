import React, { useMemo } from 'react';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

// lumine.network serves this same site; visitors arriving through it see the
// Lumine wordmark instead of Twinkle's.
const isLumineHost = /(^|\.)lumine\.network$/.test(window.location.hostname);

export default function TwinkleLogo({
  style
}: {
  style?: React.CSSProperties;
}) {
  const logoTwinRole = useRoleColor('logoTwin', { fallback: 'logoBlue' });
  const logoKleRole = useRoleColor('logoKle', { fallback: 'logoGreen' });
  const twinColor = useMemo(
    () => logoTwinRole.getColor() || Color.logoBlue(),
    [logoTwinRole]
  );
  const kleColor = useMemo(
    () => logoKleRole.getColor() || Color.logoGreen(),
    [logoKleRole]
  );

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
          > .logo-spark {
            width: 1.1rem;
            height: 1.1rem;
            margin-left: 0.15rem;
            vertical-align: top;
            transform: translateY(-0.35rem);
            color: ${Color.gold()};
            animation: lumineSparkTwinkle 2.6s ease-in-out infinite;
          }
          @keyframes lumineSparkTwinkle {
            0%,
            100% {
              opacity: 0.75;
              transform: translateY(-0.35rem) scale(0.85) rotate(0deg);
            }
            50% {
              opacity: 1;
              transform: translateY(-0.35rem) scale(1.15) rotate(18deg);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            > .logo-spark {
              animation: none;
            }
          }
        `}
      >
        {isLumineHost ? (
          <>
            <span className="logo logo-twin">Lumine</span>
            <svg
              className="logo logo-spark"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0c1.1 6.6 4.4 10.9 12 12-7.6 1.1-10.9 5.4-12 12-1.1-6.6-4.4-10.9-12-12 7.6-1.1 10.9-5.4 12-12z" />
            </svg>
          </>
        ) : (
          <>
            <span className="logo logo-twin">Twin</span>
            <span className="logo logo-kle">kle</span>
          </>
        )}
      </div>
    </div>
  );
}
