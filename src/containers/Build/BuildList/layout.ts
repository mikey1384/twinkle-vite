import type { CSSProperties } from 'react';
import { Color } from '~/constants/css';

export const logoBlueOpenAppButtonStyle = {
  ['--build-open-app-bg' as const]: Color.logoBlue(),
  ['--build-open-app-hover-bg' as const]: Color.darkBlue(),
  ['--build-open-app-border' as const]: Color.darkBlue(0.82),
  ['--build-open-app-focus' as const]: Color.logoBlue(0.9)
} as CSSProperties;

export const buildActivityRailBreakpoint = '1180px';
export const buildActivityRailWidth = '30rem';
export const buildActivityCacheFreshMs = 60 * 1000;
export const buildPageTopGap = '2rem';
export const mobileBottomNavClearance =
  'calc(var(--mobile-nav-height, 7rem) + env(safe-area-inset-bottom, 0px) + 2rem)';
