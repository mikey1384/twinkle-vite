import { css, keyframes } from '@emotion/css';

const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9 0.02' numOctaves='2' seed='7'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.52  0 0 0 0 0.55  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

// a polished plate under a soft light, with fine horizontal grain over it
export const surfaceClass = css`
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background:
    linear-gradient(
      172deg,
      rgba(255, 255, 255, 0.55) 0%,
      rgba(255, 255, 255, 0) 38%,
      rgba(0, 0, 0, 0.08) 72%,
      rgba(0, 0, 0, 0.16) 100%
    ),
    linear-gradient(
      100deg,
      #d5d9df 0%,
      #fbfcfd 22%,
      #d5d9df 46%,
      #a9b0ba 68%,
      #d5d9df 84%,
      #fbfcfd 100%
    );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    inset 0 -1px 0 rgba(60, 66, 76, 0.35);
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      repeating-linear-gradient(
        0deg,
        rgba(255, 255, 255, 0.18) 0 1px,
        rgba(0, 0, 0, 0.035) 1px 2px,
        rgba(255, 255, 255, 0) 2px 3px
      ),
      ${NOISE};
    mix-blend-mode: overlay;
    opacity: 0.75;
  }
`;

const FRAME = { cover: 12, card: 6, strip: 3 };

export const frameClass = (size: keyof typeof FRAME) => css`
  padding: ${FRAME[size]}px;
`;

// set into the plate: a dark lip top/left, a lit lip bottom/right, and a soft
// graphite fade at the bottom so a name stays readable over any picture
export const photoClass = (size: keyof typeof FRAME) => css`
  label: pt-layer-photo;
  position: absolute;
  inset: ${FRAME[size]}px;
  z-index: 2;
  border-radius: ${size === 'strip' ? 2 : 6}px;
  background-size: cover;
  box-shadow:
    0 -1px 0 rgba(70, 76, 86, 0.55),
    -1px 0 0 rgba(70, 76, 86, 0.4),
    0 1px 0 rgba(255, 255, 255, 0.95),
    1px 0 0 rgba(255, 255, 255, 0.8),
    inset 0 2px 6px rgba(0, 0, 0, 0.35);
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
      linear-gradient(
        0deg,
        rgba(20, 23, 28, 0.62) 0%,
        rgba(20, 23, 28, 0.18) 34%,
        rgba(20, 23, 28, 0) 55%
      ),
      radial-gradient(
        120% 140% at 50% 50%,
        rgba(0, 0, 0, 0) 62%,
        rgba(214, 219, 226, 0.28) 100%
      );
  }
`;

const sweep = keyframes`
  0% { transform: translate3d(-55%, 0, 0); opacity: 0; }
  6% { opacity: 1; }
  48% { transform: translate3d(55%, 0, 0); opacity: 1; }
  54%, 100% { transform: translate3d(55%, 0, 0); opacity: 0; }
`;

// the light: a wide soft band that crosses slowly, then rests
export const sheenClass = (size: keyof typeof FRAME) => css`
  label: pt-layer-sheen;
  position: absolute;
  inset: -40% -60%;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(
    105deg,
    rgba(255, 255, 255, 0) 41%,
    rgba(255, 255, 255, 0.22) 47%,
    rgba(255, 255, 255, 0.5) 50%,
    rgba(255, 255, 255, 0.22) 53%,
    rgba(255, 255, 255, 0) 59%
  );
  mix-blend-mode: screen;
  transform: translate3d(-55%, 0, 0);
  animation: ${sweep} ${size === 'cover' ? 14 : 11}s
    cubic-bezier(0.45, 0.05, 0.25, 1) infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0;
  }
`;

// a broad glow that leans toward the pointer, like tilting the plate
export const leanClass = css`
  label: pt-layer-lean;
  position: absolute;
  inset: -30%;
  z-index: 1;
  pointer-events: none;
  background: radial-gradient(
    closest-side,
    rgba(255, 255, 255, 0.55),
    rgba(255, 255, 255, 0) 70%
  );
  mix-blend-mode: soft-light;
  transform: translate3d(var(--pt-x, 0px), var(--pt-y, 0px), 0);
  transition: transform 900ms cubic-bezier(0.2, 0.7, 0.2, 1);
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// cover text on plain metal: graphite, lightly embossed
export const platinumInk = '#262a31';
export const platinumInkSoft = '#4a515c';
export const platinumEmboss =
  '0 1px 0 rgba(255, 255, 255, 0.85), 0 -1px 0 rgba(40, 44, 52, 0.18)';
export const photoInkShadow = '0 1px 2px rgba(0, 0, 0, 0.55)';
