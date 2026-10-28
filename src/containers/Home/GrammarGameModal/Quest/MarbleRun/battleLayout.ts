import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { INK, NIGHT, PARCHMENT, frame } from '../pixelUi';

// Shared by normal Quest battles and Nemesis reviews. Keep the canvas and
// question dock fitted together, including short landscape screens.
export const wrapCls = css`
  position: fixed;
  inset: 0;
  z-index: 2147482000;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: ${INK};
  background:
    radial-gradient(
      ellipse at 50% 30%,
      rgba(90, 70, 140, 0.35) 0,
      rgba(26, 20, 38, 0) 60%
    ),
    #1a1426;
`;

export const bossCls = css`
  color: #f3eefc;
  background:
    radial-gradient(
      ellipse at 50% 30%,
      rgba(140, 40, 90, 0.3) 0,
      rgba(20, 13, 34, 0) 60%
    ),
    #140d22;
`;

export const bodyCls = css`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 0.8rem 1rem 1rem;
  overflow: hidden;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.5rem;
    padding: 0.5rem 0.4rem 0.6rem;
  }
  @media (max-height: 520px) {
    gap: 0.4rem;
    padding: 0.3rem 0.6rem 0.4rem;
  }
  /* short landscape screens (phones on their side): stage beside the card */
  @media (max-height: 520px) and (orientation: landscape) {
    flex-direction: row;
    align-items: center;
    gap: 0.8rem;
  }
`;

export const dockCls = css`
  flex: 0 1 auto;
  min-height: 0;
  width: 100%;
  max-width: calc(1000 * var(--px));
  max-height: 100%;
  @media (max-height: 520px) and (orientation: landscape) {
    flex: 1;
    width: auto;
    min-width: 0;
  }
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  @media (max-height: 520px) {
    gap: 0.3rem;
  }
`;

export const stageFitCls = css`
  flex: none;
  max-width: calc(1320 * var(--px));
  canvas {
    border-radius: 0;
  }
`;

export const cardCls = css`
  ${frame(PARCHMENT, 3)}
  flex: 0 1 auto;
  min-height: 0;
  overflow-y: auto;
  /* a miss's ✗ badge on a button at the edge never adds a sideways scroll */
  overflow-x: hidden;
  width: 100%;
  max-width: calc(980 * var(--px));
  @media (max-width: ${mobileMaxWidth}) {
    ${frame(PARCHMENT, 2)}
  }
`;

export const bossCardCls = css`
  ${frame(NIGHT, 3)}
  @media (max-width: ${mobileMaxWidth}) {
    ${frame(NIGHT, 2)}
  }
`;

export const cardInnerCls = css`
  padding: 0.8rem 1.2rem 1rem;
  @media (min-height: 760px) {
    min-height: 15rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.6rem 0.6rem 0.8rem;
  }
  @media (max-height: 520px) {
    padding: 0.4rem 0.8rem 0.6rem;
  }
`;

export const ruleScrollCls = css`
  max-height: 26vh;
  max-height: 26dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
  @media (max-height: 520px) {
    max-height: 22vh;
    max-height: 22dvh;
  }
`;

const RULE_FADE =
  'linear-gradient(#000 max(60%, calc(100% - 2.4rem)), transparent)';
export const ruleFadeCls = css`
  -webkit-mask-image: ${RULE_FADE};
  mask-image: ${RULE_FADE};
`;
