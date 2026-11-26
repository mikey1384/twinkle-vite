import { css, keyframes } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { APP_SHELL_FIXED_BOTTOM_OFFSET_STYLE } from '~/constants/appShell';
import type { WelcomeTourGuide } from './rules';

// One look for the greeter and the tour: a visual-novel dialogue box in deep
// navy with the guide's colour as its accent (solid colours only).
export const GUIDE_COLOR: Record<WelcomeTourGuide, string> = {
  zero: 'rgb(65, 140, 235)',
  ciel: 'rgb(255, 105, 180)'
};
export const GUIDE_SOFT: Record<WelcomeTourGuide, string> = {
  zero: 'rgba(65, 140, 235, 0.18)',
  ciel: 'rgba(255, 105, 180, 0.18)'
};
export const GUIDE_NAME: Record<WelcomeTourGuide, 'Zero' | 'Ciel'> = {
  zero: 'Zero',
  ciel: 'Ciel'
};

const PANEL = '#121833';
const PANEL_RAISED = '#1b2347';
const INK = '#f3f5ff';
const MUTED = '#b3bcdf';
const LINE = 'rgba(255, 255, 255, 0.12)';
// above the page and its floating buttons, below the mobile nav and modals
export const WELCOME_Z = 90000;

export const slideUp = keyframes`
  from { opacity: 0; transform: translateY(36px); }
  to { opacity: 1; transform: none; }
`;
const rise = keyframes`
  from { opacity: 0; transform: translateY(18px) scale(0.97); }
  to { opacity: 1; transform: none; }
`;
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

export const bottomDockClass = css`
  position: fixed;
  z-index: ${WELCOME_Z};
  left: 50%;
  bottom: 2.4rem;
  transform: translateX(-50%);
  width: min(78rem, calc(100vw - 3.2rem));
  pointer-events: none;
  @media (max-width: ${mobileMaxWidth}) {
    left: 1rem;
    right: 1rem;
    width: auto;
    transform: none;
    bottom: calc(${APP_SHELL_FIXED_BOTTOM_OFFSET_STYLE} + 1rem);
  }
`;

export const greeterWrapClass = css`
  position: relative;
  pointer-events: auto;
  padding-top: 15rem;
  animation: ${slideUp} 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  @media (max-width: ${mobileMaxWidth}) {
    padding-top: 9.6rem;
  }
`;

export const spriteClass = css`
  position: absolute;
  bottom: calc(100% - 15rem - 2.4rem);
  height: 21rem;
  width: auto;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 0.6rem 1.2rem rgba(0, 0, 0, 0.35));
  animation: ${rise} 0.55s 0.15s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  &[data-side='left'] {
    left: 1.6rem;
  }
  &[data-side='right'] {
    right: 1.6rem;
    animation-delay: 0.25s;
  }
  @media (max-width: ${mobileMaxWidth}) {
    height: 13rem;
    bottom: calc(100% - 9.6rem - 1.6rem);
    &[data-side='left'] {
      left: 0.6rem;
    }
    &[data-side='right'] {
      right: 0.6rem;
    }
  }
`;

export const boxClass = css`
  position: relative;
  background: ${PANEL};
  color: ${INK};
  border: 1px solid ${LINE};
  border-radius: 1.8rem;
  box-shadow: 0 1.6rem 4rem rgba(5, 8, 24, 0.45);
  padding: 2.2rem 2.4rem 2rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.8rem 1.6rem 1.6rem;
    border-radius: 1.6rem;
  }
`;

export const namePlateClass = css`
  position: absolute;
  top: -1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 1.4rem;
  border-radius: 999px;
  background: ${PANEL_RAISED};
  border: 1px solid ${LINE};
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  .zero {
    color: ${GUIDE_COLOR.zero};
  }
  .ciel {
    color: ${GUIDE_COLOR.ciel};
  }
`;

export const lineClass = css`
  margin: 0.4rem 0 1.6rem;
  font-size: 1.75rem;
  line-height: 1.45;
  font-weight: 600;
  text-align: center;
  padding: 0 2.8rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.55rem;
    margin-bottom: 1.3rem;
    padding: 0 2.6rem;
  }
`;

export const choicesClass = css`
  display: flex;
  justify-content: center;
  gap: 1.2rem;
  flex-wrap: wrap;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
    gap: 0.8rem;
    > * {
      width: 100%;
    }
  }
`;

export const choiceButtonClass = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  min-width: 24rem;
  padding: 0.9rem 1.6rem 0.9rem 0.9rem;
  border-radius: 1.2rem;
  border: 2px solid var(--guide);
  background: var(--guide-soft);
  color: ${INK};
  font-size: 1.55rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.12s ease, background 0.12s ease;
  img {
    width: 3.6rem;
    height: 3.6rem;
    border-radius: 50%;
    object-fit: cover;
    object-position: 50% 8%;
    background: ${PANEL_RAISED};
  }
  &:hover {
    transform: translateY(-1px);
    background: var(--guide);
  }
  &:focus-visible {
    outline: 3px solid ${INK};
    outline-offset: 2px;
  }
  @media (max-width: ${mobileMaxWidth}) {
    min-width: 0;
    font-size: 1.5rem;
  }
`;

export const quietRowClass = css`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
  button {
    background: none;
    border: none;
    color: ${MUTED};
    font-size: 1.3rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.4rem 0.8rem;
    &:hover {
      color: ${INK};
    }
  }
`;

export const closeClass = css`
  position: absolute;
  top: 0.9rem;
  right: 0.9rem;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: ${MUTED};
  font-size: 1.6rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background: ${PANEL_RAISED};
    color: ${INK};
  }
`;

// ---- the tour panel --------------------------------------------------------
export const tourDockClass = css`
  position: fixed;
  z-index: ${WELCOME_Z};
  right: 2.4rem;
  bottom: 2.4rem;
  width: 44rem;
  max-width: calc(100vw - 3.2rem);
  pointer-events: none;
  &[data-beside-dock='true'] {
    right: auto;
    left: 2.4rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    left: 1rem;
    right: 1rem;
    width: auto;
    max-width: none;
    bottom: calc(${APP_SHELL_FIXED_BOTTOM_OFFSET_STYLE} + 0.8rem);
    &[data-beside-dock='true'] {
      left: 1rem;
    }
  }
`;

export const tourPanelClass = css`
  position: relative;
  pointer-events: auto;
  margin-top: 6.4rem;
  background: ${PANEL};
  color: ${INK};
  border: 1px solid ${LINE};
  border-top: 3px solid var(--guide);
  border-radius: 1.6rem;
  box-shadow: 0 1.6rem 4rem rgba(5, 8, 24, 0.45);
  padding: 1.2rem 1.6rem 1.4rem;
  animation: ${slideUp} 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  @media (max-width: ${mobileMaxWidth}) {
    margin-top: 5.2rem;
    padding: 1rem 1.2rem 1.2rem;
  }
`;

export const tourSpriteClass = css`
  position: absolute;
  left: 0.8rem;
  bottom: calc(100% - 5.4rem);
  height: 12rem;
  width: 8rem;
  object-fit: cover;
  object-position: 50% 0;
  user-select: none;
  pointer-events: none;
  filter: drop-shadow(0 0.4rem 0.8rem rgba(0, 0, 0, 0.35));
  @media (max-width: ${mobileMaxWidth}) {
    height: 10rem;
    width: 6.6rem;
    bottom: calc(100% - 4.4rem);
  }
`;

export const tourHeadClass = css`
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding-left: 8.4rem;
  /* room for Skip tour in the corner */
  padding-right: 7.6rem;
  min-height: 4.4rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding-left: 7rem;
    min-height: 3.6rem;
  }
`;

// every stop visible at once (wrapping), so none is cut off
export const stripClass = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  padding: 0.2rem 0 0.4rem;
`;

export const stripChipClass = css`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  border: 1px solid ${LINE};
  background: transparent;
  color: ${MUTED};
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  &[data-mark='current'] {
    background: var(--guide);
    border-color: var(--guide);
    color: #fff;
  }
  &[data-mark='done'] {
    color: ${INK};
    background: ${PANEL_RAISED};
  }
  &[data-mark='skipped'] {
    border-style: dashed;
  }
  &:hover {
    color: ${INK};
  }
  &:focus-visible {
    outline: 2px solid ${INK};
    outline-offset: 1px;
  }
`;

export const tourTitleRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 0.6rem 0 0.4rem;
  h3 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 800;
    color: ${INK};
  }
`;

export const badgeClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  background: ${PANEL_RAISED};
  color: ${MUTED};
  font-size: 1.15rem;
  font-weight: 700;
`;

export const freeBadgeClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 196, 61, 0.16);
  color: rgb(255, 205, 92);
  font-size: 1.2rem;
  font-weight: 800;
`;

export const tourLineClass = css`
  margin: 0 0 1rem;
  font-size: 1.55rem;
  line-height: 1.5;
  color: ${INK};
  min-height: 4.6rem;
  cursor: default;
  &[data-typing='true']::after {
    content: '▍';
    margin-left: 0.1rem;
    color: var(--guide);
    animation: ${pulse} 0.9s ease-in-out infinite;
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.45rem;
    min-height: 4.2rem;
  }
`;

export const extraClass = css`
  margin: 0 0 1.1rem;
  max-height: 24rem;
  overflow-y: auto;
  @media (max-width: ${mobileMaxWidth}) {
    max-height: 30vh;
  }
`;

export const actionsClass = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  .spacer {
    flex: 1;
  }
`;

export const ghostButtonClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid ${LINE};
  background: transparent;
  color: ${INK};
  border-radius: 999px;
  padding: 0.6rem 1.1rem;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    background: ${PANEL_RAISED};
  }
  small {
    color: rgb(255, 205, 92);
    font-weight: 800;
    font-size: 1.15rem;
  }
`;

export const primaryButtonClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  background: var(--guide);
  color: #fff;
  border-radius: 999px;
  padding: 0.7rem 1.5rem;
  font-size: 1.4rem;
  font-weight: 800;
  cursor: pointer;
  &:hover {
    filter: brightness(1.08);
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

// "Skip tour" (Close on the last screen), quiet, in the panel's corner
export const skipTourClass = css`
  position: absolute;
  top: 0.8rem;
  right: 0.8rem;
  border: none;
  background: transparent;
  color: ${MUTED};
  font-size: 1.25rem;
  font-weight: 700;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  cursor: pointer;
  &:hover {
    background: ${PANEL_RAISED};
    color: ${INK};
  }
  &:focus-visible {
    outline: 2px solid ${INK};
    outline-offset: 1px;
  }
`;

const pop = keyframes`
  0% { opacity: 0; transform: scale(0.4) rotate(-20deg); }
  60% { opacity: 1; transform: scale(1.18) rotate(8deg); }
  100% { opacity: 1; transform: none; }
`;

// the "You've seen it all!" moment: a small party horn that pops in
export const celebrateClass = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--guide);
  color: #fff;
  font-size: 1.5rem;
  animation: ${pop} 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// the Lumine stop with the project Twinkle already made them
export const projectCardClass = css`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.8rem;
  border-radius: 1.1rem;
  border: 1px solid var(--guide);
  background: ${PANEL_RAISED};
  .thumb {
    flex-shrink: 0;
    width: 4.4rem;
    height: 4.4rem;
    border-radius: 0.8rem;
    background: #0d1229;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--guide);
    font-size: 1.8rem;
  }
  .text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  b {
    font-size: 1.4rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  small {
    color: ${MUTED};
    font-size: 1.15rem;
  }
  button {
    flex-shrink: 0;
  }
`;

export const skipButtonClass = css`
  border: none;
  background: transparent;
  color: ${MUTED};
  font-size: 1.35rem;
  font-weight: 700;
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  &:hover {
    color: ${INK};
  }
`;

export const spotlightClass = css`
  position: fixed;
  z-index: ${WELCOME_Z - 1};
  pointer-events: none;
  border-radius: 1.2rem;
  box-shadow: 0 0 0 3px var(--guide), 0 0 0 9999px rgba(6, 9, 26, 0.42);
  transition: top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease;
`;

// small cards and chips inside the panel
export const choiceGridClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.6rem;
`;
export const choiceChipClass = css`
  border: 1px solid ${LINE};
  background: ${PANEL_RAISED};
  color: ${INK};
  border-radius: 1rem;
  padding: 0.7rem 1.1rem;
  font-size: 1.35rem;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    border-color: var(--guide);
  }
  &[data-highlight='true'] {
    border-color: var(--guide);
    background: var(--guide-soft);
  }
`;
export const questionClass = css`
  font-size: 1.45rem;
  font-weight: 800;
  margin: 0;
`;
export const ownInputClass = css`
  width: 100%;
  margin-top: 0.8rem;
  border: 1px solid ${LINE};
  background: #0d1229;
  color: ${INK};
  border-radius: 1rem;
  padding: 0.8rem 1rem;
  font-size: 1.4rem;
  &::placeholder {
    color: ${MUTED};
  }
  &:focus {
    outline: 2px solid var(--guide);
  }
`;
export const mutedTextClass = css`
  color: ${MUTED};
  font-size: 1.25rem;
  margin: 0.6rem 0 0;
`;
export const appCardsClass = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
`;
export const appCardClass = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem;
  border-radius: 1.1rem;
  border: 1px solid ${LINE};
  background: ${PANEL_RAISED};
  color: ${INK};
  cursor: pointer;
  text-align: left;
  min-width: 0;
  img,
  .thumb {
    flex-shrink: 0;
    width: 4.4rem;
    height: 4.4rem;
    border-radius: 0.8rem;
    object-fit: cover;
    background: #0d1229;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--guide);
    font-size: 1.8rem;
  }
  span {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  b {
    font-size: 1.35rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  small {
    color: ${MUTED};
    font-size: 1.15rem;
  }
  &[data-pinned='true'] {
    border-color: var(--guide);
  }
  &:hover {
    border-color: var(--guide);
  }
`;
export const examGroupClass = css`
  margin-bottom: 0.9rem;
  h4 {
    margin: 0 0 0.45rem;
    font-size: 1.2rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${MUTED};
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }
  li {
    padding: 0.3rem 0.75rem;
    border-radius: 0.8rem;
    background: ${PANEL_RAISED};
    font-size: 1.25rem;
    font-weight: 600;
  }
`;
