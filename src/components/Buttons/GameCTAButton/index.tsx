import React from 'react';
import { css } from '@emotion/css';
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
  loading = false
}: {
  onClick: () => void;
  children: React.ReactNode;
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
}) {
  const hasLabel = !!(
    children && !(typeof children === 'string' && children.trim().length === 0)
  );
  const cls = getButtonCls({ variant, size, shiny, toggled });
  return (
    <button
      onClick={onClick}
      className={cls}
      style={style}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      <Icon icon={loading ? 'spinner' : icon} pulse={loading} />
      {hasLabel ? <span className={labelCls}>{children}</span> : null}
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
    sm: { fs: '0.9rem', pad: '0.625rem 1rem' },
    md: { fs: '1rem', pad: '0.75rem 1.25rem' },
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

    ${toggled
      ? `
      background: ${c.active};
      transform: translateY(2px);
      box-shadow: none;
    `
      : ''}

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: -150%;
      width: 50%;
      height: 100%;
      background: linear-gradient(120deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.12) 100%);
      transform: skewX(-20deg);
      animation: ${shiny ? 'shine 1.8s linear infinite' : 'none'};
      display: ${shiny ? 'block' : 'none'};
    }
    &:disabled::after {
      display: none;
    }
    @keyframes shine {
      0% { left: -150%; }
      100% { left: 200%; }
    }

    @media (max-width: ${tabletMaxWidth}) {
      font-size: calc(${s.fs} - 0.1rem);
      padding: 0.625rem 1rem;
    }
  `;
}

const labelCls = css`
  letter-spacing: 0.2px;
`;
