import React from 'react';
import { css, keyframes } from '@emotion/css';
import { tabletMaxWidth } from '~/constants/css';
import Icon from '~/components/Icon';

export default function GameCTAButton({
  onClick,
  children,
  icon = '',
  style,
  disabled,
  variant = 'primary',
  size = 'md',
  shiny = false,
  toggled = false,
  loading = false,
  arcade = false,
  'aria-label': ariaLabel
}: {
  onClick: () => void;
  children?: React.ReactNode;
  icon?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  variant?:
    | 'primary'
    | 'success'
    | 'neutral'
    | 'magenta'
    | 'logoBlue'
    | 'pink'
    | 'orange'
    | 'gold'
    | 'purple';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shiny?: boolean;
  toggled?: boolean;
  loading?: boolean;
  // Optional neon arcade look (Grammarbles Classic). Off by default, so
  // every other button renders exactly as before.
  arcade?: boolean;
  'aria-label'?: string;
}) {
  const hasLabel = !!(
    children && !(typeof children === 'string' && children.trim().length === 0)
  );
  const showIcon = Boolean(icon);
  const baseCls = getButtonCls({ variant, size, shiny, toggled });
  const cls = arcade ? `${baseCls} ${getArcadeCls(variant)}` : baseCls;
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      className={cls}
      style={style}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {showIcon ? <Icon icon={icon} /> : null}
      {hasLabel ? <span className={labelCls}>{children}</span> : null}
      {loading ? (
        <Icon
          icon="spinner"
          pulse
          className={css`
            margin-left: ${hasLabel || showIcon ? '0.6rem' : '0'};
          `}
        />
      ) : null}
    </button>
  );
}

function getButtonCls({
  variant,
  size,
  shiny,
  toggled
}: {
  variant:
    | 'primary'
    | 'success'
    | 'neutral'
    | 'magenta'
    | 'logoBlue'
    | 'pink'
    | 'orange'
    | 'gold'
    | 'purple';
  size: 'sm' | 'md' | 'lg' | 'xl';
  shiny: boolean;
  toggled: boolean;
}) {
  const colorMap = {
    primary: {
      bg: '#3b82f6',
      border: '#2563eb',
      hover: '#2563eb',
      active: '#1d4ed8',
      shadow: '#1d4ed8'
    },
    success: {
      bg: '#22c55e',
      border: '#16a34a',
      hover: '#16a34a',
      active: '#15803d',
      shadow: '#15803d'
    },
    neutral: {
      bg: '#64748b',
      border: '#475569',
      hover: '#475569',
      active: '#334155',
      shadow: '#334155'
    },
    magenta: {
      bg: '#ec4899',
      border: '#db2777',
      hover: '#db2777',
      active: '#be185d',
      shadow: '#be185d'
    },
    logoBlue: {
      // exact hex values based on theme tones
      bg: '#418CEB', // logoBlue
      border: '#0046C3', // darkBlue
      hover: '#0046C3',
      active: '#056EB2', // blue
      shadow: '#003AA5' // slightly darker than border for clearer separation
    },
    pink: {
      // exact hex values inspired by theme
      bg: '#F3677B', // passionFruit
      border: '#E65070', // cranberry
      hover: '#E65070',
      active: '#DF0066', // rose
      shadow: '#DF0066'
    },
    orange: {
      // exact hex values inspired by theme
      bg: '#FF9A00', // more orange
      border: '#F5BE46', // swapped with previous shadow (reversed)
      hover: '#FF8C00',
      active: '#EBA046',
      shadow: '#FF8C00' // swapped with previous border (reversed)
    },
    gold: {
      // exact hex values inspired by theme
      bg: '#FFD564', // brightGold
      border: '#FAC132', // darkGold
      hover: '#FFCB32', // gold
      active: '#FAC132',
      shadow: '#FAC132'
    },
    purple: {
      bg: '#9333ea',
      border: '#7e22ce',
      hover: '#7e22ce',
      active: '#6b21a8',
      shadow: '#6b21a8'
    }
  } as const;
  const sz = {
    sm: { fs: '1.1rem', pad: '0.625rem 1rem' },
    md: { fs: '1.1rem', pad: '0.75rem 1.25rem' },
    lg: { fs: '1.25rem', pad: '1rem 1.5rem' },
    xl: { fs: '1.6rem', pad: '1.3rem 2rem' }
  } as const;
  const c = colorMap[variant];
  const s = sz[size];
  return css`
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    background: ${c.bg};
    border: 2px solid ${c.border};
    color: white;
    text-align: center;
    font-weight: 700;
    font-size: ${s.fs};
    border-radius: 8px;
    padding: ${s.pad};
    transition: all 0.15s ease;
    box-shadow: 0 2px 0 ${c.shadow};
    position: relative;
    overflow: hidden;

    &:hover:not(:disabled) {
      background: ${c.hover};
      transform: translateY(1px);
      box-shadow: 0 1px 0 ${c.shadow};
    }

    &:active:not(:disabled) {
      background: ${c.active};
      transform: translateY(2px);
      box-shadow: none;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    ${
      toggled
        ? `
      background: ${c.active};
      transform: translateY(2px);
      box-shadow: none;
    `
        : ''
    }

    /* The sheen moves by transform only. Animating left re-laid out the page
       on every frame for as long as a shiny button was on screen (several on
       a signed-in home page), which kept phones busy and warm. Its width is
       half the button's, so translateX(-300%..400%) is the old
       left: -150%..200% sweep. */
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 50%;
      height: 100%;
      background: linear-gradient(
        120deg,
        rgba(255, 255, 255, 0.12) 0%,
        rgba(255, 255, 255, 0.35) 50%,
        rgba(255, 255, 255, 0.12) 100%
      );
      transform: translateX(-300%) skewX(-20deg);
      will-change: ${shiny ? 'transform' : 'auto'};
      pointer-events: none;
      animation: ${shiny ? 'shine 1.8s linear infinite' : 'none'};
      display: ${shiny ? 'block' : 'none'};
    }
    &:disabled::after {
      display: none;
    }
    @keyframes shine {
      0% {
        transform: translateX(-300%) skewX(-20deg);
      }
      100% {
        transform: translateX(400%) skewX(-20deg);
      }
    }

    @media (max-width: ${tabletMaxWidth}) {
      font-size: ${s.fs};
      padding: 0.625rem 1rem;
    }
  `;
}

const labelCls = css`
  letter-spacing: 0.2px;
`;

const arcadePulse = keyframes`
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.85; }
`;

// A chunky arcade start button: neon gradient, glow, a deep 3D lip that
// presses down, pixel type. Uses the variant's own colours.
function getArcadeCls(variant: keyof typeof arcadeColors) {
  const c = arcadeColors[variant] || arcadeColors.primary;
  return css`
    font-family: 'Press Start 2P', monospace;
    font-weight: 400;
    font-size: 1.4rem;
    line-height: 1.5;
    letter-spacing: 0.04em;
    min-height: 56px;
    padding: 1.4rem 2.6rem;
    border-radius: 14px;
    color: #fff;
    text-shadow:
      0 2px 0 rgba(0, 0, 0, 0.45),
      0 0 8px rgba(255, 255, 255, 0.35);
    background: linear-gradient(
      180deg,
      ${c.top} 0%,
      ${c.mid} 55%,
      ${c.low} 100%
    );
    border: 2px solid ${c.rim};
    box-shadow:
      0 6px 0 ${c.lip},
      0 8px 18px rgba(0, 0, 0, 0.45),
      0 0 22px ${c.glow},
      inset 0 2px 0 rgba(255, 255, 255, 0.45);
    /* a soft inner light that breathes (opacity only) */
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: radial-gradient(
        ellipse 70% 90% at 50% 0%,
        rgba(255, 255, 255, 0.45),
        transparent 70%
      );
      opacity: 0.25;
      animation: ${arcadePulse} 1.8s ease-in-out infinite;
      pointer-events: none;
    }
    &:hover:not(:disabled) {
      background: linear-gradient(
        180deg,
        ${c.top} 0%,
        ${c.mid} 55%,
        ${c.low} 100%
      );
      transform: translateY(2px);
      box-shadow:
        0 4px 0 ${c.lip},
        0 6px 14px rgba(0, 0, 0, 0.45),
        0 0 30px ${c.glow},
        inset 0 2px 0 rgba(255, 255, 255, 0.45);
    }
    &:active:not(:disabled) {
      background: linear-gradient(180deg, ${c.mid} 0%, ${c.low} 100%);
      transform: translateY(6px);
      box-shadow:
        0 0 0 ${c.lip},
        0 0 18px ${c.glow},
        inset 0 2px 0 rgba(255, 255, 255, 0.3);
    }
    &:disabled {
      opacity: 1;
      filter: saturate(0.35) brightness(0.75);
      box-shadow:
        0 6px 0 ${c.lip},
        inset 0 2px 0 rgba(255, 255, 255, 0.25);
    }
    &:disabled::before {
      display: none;
    }
    @media (max-width: ${tabletMaxWidth}) {
      font-size: 1.2rem;
      padding: 1.2rem 1.8rem;
    }
    @media (prefers-reduced-motion: reduce) {
      &::before {
        animation: none;
      }
    }
  `;
}

const arcadeColors = {
  primary: {
    top: '#7cb4ff',
    mid: '#3b82f6',
    low: '#1d4ed8',
    rim: '#a9ccff',
    lip: '#0f2a7a',
    glow: 'rgba(59,130,246,0.7)'
  },
  success: {
    top: '#7dffb6',
    mid: '#22c55e',
    low: '#15803d',
    rim: '#a8ffd0',
    lip: '#0b4a24',
    glow: 'rgba(61,255,160,0.6)'
  },
  neutral: {
    top: '#a3b0c8',
    mid: '#64748b',
    low: '#334155',
    rim: '#c3cde0',
    lip: '#1e2533',
    glow: 'rgba(148,163,184,0.5)'
  },
  magenta: {
    top: '#ff8fd0',
    mid: '#ec4899',
    low: '#be185d',
    rim: '#ffc2e6',
    lip: '#6b0d36',
    glow: 'rgba(236,72,153,0.7)'
  },
  logoBlue: {
    top: '#6ff0ff',
    mid: '#418ceb',
    low: '#2a3fc4',
    rim: '#9ff6ff',
    lip: '#14206e',
    glow: 'rgba(79,243,255,0.65)'
  },
  pink: {
    top: '#ffa3b2',
    mid: '#f3677b',
    low: '#c93a60',
    rim: '#ffc9d3',
    lip: '#6e1630',
    glow: 'rgba(255,105,180,0.65)'
  },
  orange: {
    top: '#ffc46b',
    mid: '#ff9a00',
    low: '#d96a00',
    rim: '#ffe0a8',
    lip: '#6e3500',
    glow: 'rgba(255,154,0,0.65)'
  },
  gold: {
    top: '#fff1a8',
    mid: '#ffcb32',
    low: '#e3a40f',
    rim: '#fff6c8',
    lip: '#7a5404',
    glow: 'rgba(255,213,74,0.7)'
  },
  purple: {
    top: '#c79bff',
    mid: '#9333ea',
    low: '#6b21a8',
    rim: '#dcc2ff',
    lip: '#3a0f60',
    glow: 'rgba(178,107,255,0.7)'
  }
} as const;
