import { css, keyframes } from '@emotion/css';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { gqMedia } from '../media';

// Classic's "neon arcade" look, matched to its cover art. Everything here is
// paint only: no component reads these to decide what happens in the game.

export const PIXEL_FONT = "'Press Start 2P', monospace";
// Questions and choices stay in a plain, readable face for kids.
export const READ_FONT =
  "'Trebuchet MS', 'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

export const NEON = {
  cyan: '#4ff3ff',
  cyanRgb: '79, 243, 255',
  violet: '#c39bff',
  violetRgb: '178, 107, 255',
  green: '#3dffa0',
  greenRgb: '61, 255, 160',
  red: '#ff4d6d',
  redRgb: '255, 77, 109',
  gold: '#ffd54a',
  goldRgb: '255, 213, 74',
  ink: '#eef1ff',
  inkSoft: '#b9c2ee',
  navy: '#070b2e'
};

export const rgba = (rgb: string, alpha: number) => `rgba(${rgb}, ${alpha})`;

export const LOGO_SRC = gqMedia('img/grammar-quest/classic-logo.png');
export const BG_SRC = gqMedia('img/grammar-quest/classic-bg.jpg');

type GradeKey = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
const GRADE_FALLBACK: Record<GradeKey, keyof typeof Color> = {
  S: 'gold',
  A: 'magenta',
  B: 'orange',
  C: 'pink',
  D: 'logoBlue',
  F: 'gray'
};

// The exact grade colours the theme roles hand out, as (grade, alpha) => css.
export function useGradeColor() {
  const roles: Record<GradeKey, ReturnType<typeof useRoleColor>> = {
    S: useRoleColor('grammarGameScoreS', { fallback: 'gold' }),
    A: useRoleColor('grammarGameScoreA', { fallback: 'magenta' }),
    B: useRoleColor('grammarGameScoreB', { fallback: 'orange' }),
    C: useRoleColor('grammarGameScoreC', { fallback: 'pink' }),
    D: useRoleColor('grammarGameScoreD', { fallback: 'logoBlue' }),
    F: useRoleColor('grammarGameScoreF', { fallback: 'gray' })
  };
  return (grade: string | undefined | null, alpha = 1): string => {
    const key = (grade || '') as GradeKey;
    const role = roles[key];
    if (!role) return rgba(NEON.cyanRgb, alpha);
    return (
      role.getColor(alpha) ||
      (Color[GRADE_FALLBACK[key]] as (o?: number) => string)(alpha)
    );
  };
}

// ---- motion. Loops animate transform/opacity only (phones ran hot on
// background-position loops); bursts are one-shot.
export const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;
export const drift = keyframes`
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(0, -240px, 0); }
`;
export const twinkle = keyframes`
  0%, 100% { opacity: 0.25; transform: scale(0.7); }
  50% { opacity: 1; transform: scale(1.15); }
`;
export const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.07); }
`;
export const glowPulse = keyframes`
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
`;
export const pop = keyframes`
  0% { transform: scale(0.3); opacity: 0; }
  55% { transform: scale(1.22); opacity: 1; }
  80% { transform: scale(0.94); }
  100% { transform: scale(1); opacity: 1; }
`;
export const ringBurst = keyframes`
  from { transform: scale(0.8); opacity: 0.9; }
  to { transform: scale(2.1); opacity: 0; }
`;
export const sparkFly = keyframes`
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% {
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy)))
      scale(0.35);
    opacity: 0;
  }
`;
export const flash = keyframes`
  from { opacity: 0.85; }
  to { opacity: 0; }
`;
export const press = keyframes`
  0% { transform: scale(1); }
  40% { transform: scale(1.035); }
  100% { transform: scale(1); }
`;
export const trailRun = keyframes`
  0%, 100% { transform: translateX(0); opacity: 0.55; }
  50% { transform: translateX(-6px); opacity: 1; }
`;

export const reducedMotion = '@media (prefers-reduced-motion: reduce)';

// Dark glass with a cyan edge: the scoreboard / panel surface.
export const glassPanelCls = css`
  position: relative;
  border-radius: 16px;
  background: linear-gradient(
    180deg,
    rgba(20, 26, 84, 0.82) 0%,
    rgba(10, 12, 48, 0.9) 100%
  );
  border: 2px solid ${rgba(NEON.cyanRgb, 0.55)};
  box-shadow:
    0 0 18px ${rgba(NEON.cyanRgb, 0.28)},
    0 0 2px ${rgba(NEON.cyanRgb, 0.9)},
    inset 0 0 24px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
`;

// Pixel stars in spark sizes: a plus of 3px blocks.
export const pixelStarCls = (color: string, size = 3) => css`
  position: absolute;
  width: ${size}px;
  height: ${size}px;
  background: ${color};
  box-shadow:
    ${size}px 0 ${color},
    -${size}px 0 ${color},
    0 ${size}px ${color},
    0 -${size}px ${color},
    0 0 ${size * 3}px ${color};
  pointer-events: none;
`;
