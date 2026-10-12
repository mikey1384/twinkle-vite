import { css, keyframes } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

// Daily Reflection's paper-and-ink look (Mikey 2026-10-12: "double down on
// this design on every surface"). Warm paper and ink to match the painted
// covers (cream, amber, soft blue). Calm and editorial, not arcade.
export const PAPER = {
  background: '#f6f1e8',
  paper: '#fffdf8',
  paperDeep: '#f3ece0',
  line: 'rgba(120, 98, 70, 0.18)',
  lineStrong: 'rgba(120, 98, 70, 0.32)',
  ink: '#2f2a24',
  inkSoft: '#6b6157',
  inkFaint: '#9a8f82',
  accent: '#b4762a',
  accentSoft: 'rgba(180, 118, 42, 0.12)',
  blue: '#3f6fa8',
  blueSoft: 'rgba(63, 111, 168, 0.1)',
  done: '#4f8a4a',
  doneSoft: 'rgba(79, 138, 74, 0.12)',
  warn: '#b5523b',
  warnSoft: 'rgba(181, 82, 59, 0.1)',
  serif: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
};

// the one strong action on a screen
export const paperPrimaryButtonCls = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  border: none;
  border-radius: 999px;
  background: ${PAPER.ink};
  color: ${PAPER.paper};
  font-size: 1.5rem;
  font-weight: 700;
  padding: 0.95rem 2.2rem;
  cursor: pointer;
  transition:
    transform 0.15s,
    background 0.15s;
  &:hover:not(:disabled) {
    background: #4a4238;
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.4rem;
    padding: 0.85rem 1.8rem;
  }
`;

// a secondary choice: outlined, same shape
export const paperSecondaryButtonCls = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  border: 1px solid ${PAPER.lineStrong};
  border-radius: 999px;
  background: ${PAPER.paper};
  color: ${PAPER.ink};
  font-size: 1.4rem;
  font-weight: 600;
  padding: 0.85rem 1.8rem;
  cursor: pointer;
  transition: border-color 0.15s;
  &:hover:not(:disabled) {
    border-color: ${PAPER.accent};
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

// a quiet text action
export const paperTextButtonCls = css`
  border: none;
  background: none;
  color: ${PAPER.inkSoft};
  font-size: 1.4rem;
  font-weight: 600;
  padding: 0.85rem 1rem;
  cursor: pointer;
  &:hover:not(:disabled) {
    color: ${PAPER.ink};
  }
`;

export const paperCardCls = css`
  background: ${PAPER.paper};
  border: 1px solid ${PAPER.line};
  border-radius: 14px;
`;

const breathe = keyframes`
  0%, 100% { transform: scale(0.85); opacity: 0.45; }
  50% { transform: scale(1); opacity: 1; }
`;

// a calm "working" mark: three ink dots breathing (transform/opacity only)
export const paperWorkingDotsCls = css`
  display: inline-flex;
  gap: 0.5rem;
  span {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background: ${PAPER.accent};
    animation: ${breathe} 1.2s ease-in-out infinite;
  }
  span:nth-of-type(2) {
    animation-delay: 0.2s;
  }
  span:nth-of-type(3) {
    animation-delay: 0.4s;
  }
`;
