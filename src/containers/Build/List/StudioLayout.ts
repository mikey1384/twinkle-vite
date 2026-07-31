import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import {
  buildActivityRailBreakpoint,
  buildActivityRailWidth,
  buildPageTopGap,
  mobileBottomNavClearance
} from './constants/layout';

export const studioPageClass = css`
  width: 100%;
  max-width: calc(980px + 1.5rem + ${buildActivityRailWidth} + 4rem);
  box-sizing: border-box;
  margin: ${buildPageTopGap} auto 0;
  padding: 0 2rem 3rem;

  @media (max-width: ${buildActivityRailBreakpoint}) {
    max-width: 980px;
  }

  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 1rem ${mobileBottomNavClearance};
  }
`;

export const studioLayoutClass = css`
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 980px) ${buildActivityRailWidth};
  justify-content: center;
  align-items: start;
  gap: 1.5rem;

  @media (max-width: ${buildActivityRailBreakpoint}) {
    display: block;
  }
`;

export const studioMainClass = css`
  min-width: 0;
`;

export function getIsBuildActivityRailVisible() {
  if (typeof window === 'undefined') return false;
  const breakpoint = Number.parseInt(buildActivityRailBreakpoint, 10);
  if (!Number.isFinite(breakpoint)) return true;
  return window.innerWidth > breakpoint;
}
