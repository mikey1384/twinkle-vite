import React from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import {
  BG_SRC,
  NEON,
  READ_FONT,
  drift,
  pixelStarCls,
  reducedMotion,
  rgba,
  twinkle
} from './theme';

// Two tiles of dots, drawn once and slid upward by transform.
const smallStars = [
  [18, 30],
  [70, 110],
  [130, 40],
  [190, 160],
  [40, 200],
  [110, 180],
  [210, 80],
  [160, 220],
  [90, 60],
  [230, 20]
]
  .map(
    ([x, y]) =>
      `radial-gradient(1px 1px at ${x}px ${y}px, rgba(255,255,255,0.85), transparent)`
  )
  .join(',');
const bigStars = [
  [40, 70],
  [150, 130],
  [210, 30],
  [100, 210]
]
  .map(
    ([x, y]) =>
      `radial-gradient(1.6px 1.6px at ${x}px ${y}px, rgba(200,230,255,0.95), transparent)`
  )
  .join(',');

const TWINKLERS: { top: string; left: string; color: string; delay: string }[] =
  [
    { top: '6%', left: '7%', color: NEON.gold, delay: '0s' },
    { top: '12%', left: '91%', color: NEON.cyan, delay: '1.1s' },
    { top: '46%', left: '4%', color: '#ff7ae0', delay: '2.2s' },
    { top: '72%', left: '95%', color: NEON.gold, delay: '0.6s' }
  ];

// The deep-space backdrop Classic plays on. Only wraps Classic's game tab,
// so the rest of the modal and Quest keep their own look.
// fullBleed: the whole Grammarbles page in Classic (no panel edge or margin)
export default function ClassicArcade({
  children,
  fullBleed = false
}: {
  children: React.ReactNode;
  fullBleed?: boolean;
}) {
  return (
    <div
      className={css`
        position: relative;
        isolation: isolate;
        width: 100%;
        margin-top: 0.75rem;
        border-radius: 20px;
        color: ${NEON.ink};
        font-family: ${READ_FONT};
        /* one smooth sky, with the floor glow drawn as a background layer
           so it covers the whole panel and has no edge of its own */
        background:
          radial-gradient(
            ellipse 90% 45% at 50% 105%,
            ${rgba(NEON.violetRgb, 0.3)} 0%,
            ${rgba(NEON.violetRgb, 0.12)} 45%,
            transparent 100%
          ),
          linear-gradient(180deg, #070b2e 0%, #141256 50%, #26105f 100%);
        box-shadow:
          inset 0 0 0 1px ${rgba(NEON.violetRgb, 0.35)},
          inset 0 0 60px rgba(0, 0, 0, 0.55);
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 14px;
        }
        ${
          fullBleed
            ? `
          flex: 1;
          margin-top: 0;
          border-radius: 0;
          box-shadow: none;
          @media (max-width: ${mobileMaxWidth}) {
            border-radius: 0;
          }
        `
            : ''
        }
        ${reducedMotion} {
          & *,
          & *::before,
          & *::after {
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            animation-delay: 0s !important;
          }
        }
      `}
    >
      <div aria-hidden className={layersCls}>
        <div className="cover-haze" />
        <div className="stars stars-small" />
        <div className="stars stars-big" />
        <div className="streak streak-a" />
        <div className="streak streak-b" />
        <div className="streak streak-c" />
        {TWINKLERS.map((t, i) => (
          <span
            key={i}
            className={`${pixelStarCls(t.color)} twinkler`}
            style={{ top: t.top, left: t.left, animationDelay: t.delay }}
          />
        ))}
      </div>
      <div
        className={css`
          position: relative;
          z-index: 1;
        `}
      >
        {children}
      </div>
    </div>
  );
}

// The decoration clips itself; the panel never clips its content, so a
// tall game screen always scrolls instead of losing its top or bottom.
const layersCls = css`
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
  .cover-haze {
    position: absolute;
    inset: 0;
    background: url(${BG_SRC}) center 40% / cover no-repeat;
    opacity: 0.13;
    filter: blur(10px) saturate(1.3);
    /* fades in and back out, so the slice never ends on a hard line */
    -webkit-mask-image: linear-gradient(
      180deg,
      transparent 0%,
      #000 30%,
      #000 50%,
      transparent 85%
    );
    mask-image: linear-gradient(
      180deg,
      transparent 0%,
      #000 30%,
      #000 50%,
      transparent 85%
    );
  }
  .stars {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: calc(100% + 240px);
    background-size: 240px 240px;
    will-change: transform;
  }
  .stars-small {
    background-image: ${smallStars};
    opacity: 0.7;
    animation: ${drift} 70s linear infinite;
  }
  .stars-big {
    background-image: ${bigStars};
    animation: ${drift} 40s linear infinite;
  }
  .streak {
    position: absolute;
    height: 2px;
    border-radius: 2px;
    transform: rotate(-18deg);
    transform-origin: left center;
  }
  .streak-a {
    top: 18%;
    left: -10%;
    width: 55%;
    background: linear-gradient(
      90deg,
      transparent,
      ${rgba(NEON.cyanRgb, 0.55)},
      transparent
    );
  }
  .streak-b {
    top: 58%;
    left: 50%;
    width: 60%;
    background: linear-gradient(
      90deg,
      transparent,
      ${rgba(NEON.violetRgb, 0.6)},
      transparent
    );
  }
  .streak-c {
    top: 86%;
    left: -5%;
    width: 45%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 122, 224, 0.5),
      transparent
    );
  }
  .twinkler {
    animation: ${twinkle} 3.2s ease-in-out infinite;
  }
`;
