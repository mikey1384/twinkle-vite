import { css, keyframes } from '@emotion/css';
import { Color } from '~/constants/css';

// Roadmap palette: violet for the roadmap itself, gold for "now", emerald for
// done. Text sizes follow the chat panel's --build-workshop-* scale so the
// cards grow with the rest of the Lumine chat on phones.
export const roadmapInk = '#1f2a44';
export const roadmapMuted = '#6b7488';
export const roadmapLine = '#e3e7ef';

export const roadmapPulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
`;

const roadmapGlow = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.55; }
  50% { transform: scale(1.35); opacity: 0; }
`;

// Looping motion is transform/opacity only and stops for reduced motion.
export const pulseClass = css`
  animation: ${roadmapPulse} 1.6s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const glowRingClass = css`
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: ${Color.goldOrange(0.55)};
  animation: ${roadmapGlow} 1.8s ease-out infinite;
  pointer-events: none;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.35;
  }
`;

export const kickerClass = css`
  font-size: var(--build-workshop-tiny-font-size, 1.1rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const pillClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--build-workshop-label-font-size, 1.2rem);
  font-weight: 800;
  line-height: 1.2;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  background: #fff;
  border: 1px solid ${Color.violet(0.3)};
  color: ${Color.darkPurple()};
  white-space: nowrap;
`;

export const energyPillClass = css`
  border-color: ${Color.goldOrange(0.6)};
  background: ${Color.brightGold(0.2)};
  color: ${Color.darkAmber()};
  svg {
    color: ${Color.goldOrange()};
  }
`;

// Buttons: the shared Button with the roadmap's rounded, chunky, kid-friendly
// shape (sentence case, bold, full-width on cards).
export const roadmapButtonClass = css`
  border-radius: 12px !important;
  font-weight: 800 !important;
  font-size: var(--build-workshop-choice-font-size, 1.4rem) !important;
  padding: 1.05rem 1.4rem !important;
  min-height: 4.2rem;
`;

export const primaryButtonClass = css`
  color: #fff !important;
`;

export const ghostButtonClass = css`
  background: #fff !important;
  border-color: ${roadmapLine} !important;
  color: ${roadmapMuted} !important;
  @media (hover: hover) and (pointer: fine) {
    &:hover {
      background: ${Color.highlightGray()} !important;
      color: ${roadmapInk} !important;
    }
  }
`;
