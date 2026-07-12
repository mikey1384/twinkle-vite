import { css, keyframes } from '@emotion/css';
import { Color } from '~/constants/css';

// Server-side sentinel for an unrevealed total mystery card's hidden quality
// (see twinkle-api helpers/aiCards.ts). Must stay truthy: CardThumb refetches
// cards whose quality is falsy.
export const TOTAL_MYSTERY_QUALITY = '???';

export function isTotalMysteryQuality(
  quality?: string | null
): quality is typeof TOTAL_MYSTERY_QUALITY {
  return quality === TOTAL_MYSTERY_QUALITY;
}

// One quality color peaks every 5 seconds; the loop crossfades continuously
// through the four glowy quality colors (superior → rare → elite → legendary).
// Common is deliberately left out: it has no glow, so a "no glow" beat would
// read as a broken animation rather than a possible outcome.
export const TOTAL_MYSTERY_CYCLE_SECONDS = 20;

const cycleColors = [
  Color.limeGreen(),
  Color.purple(),
  Color.redOrange(),
  Color.darkGold()
];

export function totalMysteryCycleKeyframes(
  renderFrame: (color: string) => string
): string {
  const [superior, rare, elite, legendary] = cycleColors;
  return keyframes`
    0%, 100% { ${renderFrame(superior)} }
    25% { ${renderFrame(rare)} }
    50% { ${renderFrame(elite)} }
    75% { ${renderFrame(legendary)} }
  `;
}

export function totalMysteryCycleAnimation(
  renderFrame: (color: string) => string
): string {
  return `animation: ${totalMysteryCycleKeyframes(
    renderFrame
  )} ${TOTAL_MYSTERY_CYCLE_SECONDS}s linear infinite;`;
}

export const totalMysteryTextClass = css`
  ${totalMysteryCycleAnimation((color) => `color: ${color};`)}
`;

export const totalMysteryBorderClass = css`
  ${totalMysteryCycleAnimation((color) => `border-color: ${color};`)}
`;
