import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { useRoleColor } from '~/theme/useRoleColor';
import { Color } from '~/constants/css';

interface SwitchButtonProps {
  ariaLabel?: string;
  checked?: boolean;
  color?: string;
  disabled?: boolean;
  label?: string | React.ReactNode;
  labelStyle?: React.CSSProperties;
  onChange: () => void;
  small?: boolean;
  style?: React.CSSProperties;
  theme?: string;
}

export default function SwitchButton({
  ariaLabel,
  checked = false,
  color,
  disabled,
  label,
  labelStyle = {},
  onChange,
  small,
  style,
  theme
}: SwitchButtonProps) {
  const { color: switchRoleColor } = useRoleColor('switch', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const activeColor = color || switchRoleColor || Color.logoBlue();
  const [isFocused, setIsFocused] = useState(false);
  const mergedLabelStyle = {
    fontSize: small ? '1.1rem' : '1.3rem',
    ...labelStyle
  };

  const metrics = useMemo(() => {
    const trackWidth = small ? 48 : 60;
    const trackHeight = small ? 26 : 34;
    const knobSize = small ? 20 : 28;
    const knobTranslate = trackWidth - knobSize - (small ? 6 : 8);
    const focusOffset = trackHeight >= 32 ? 3 : 2;
    return { trackWidth, trackHeight, knobSize, knobTranslate, focusOffset };
  }, [small]);

  const palette = useMemo(() => createPalette(activeColor), [activeColor]);

  const srLabel =
    ariaLabel ||
    (typeof label === 'string'
      ? checked
        ? `Disable ${label}`
        : `Enable ${label}`
      : 'Toggle switch');

  const trackBaseClass = css`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    width: ${metrics.trackWidth}px;
    height: ${metrics.trackHeight}px;
    border-radius: ${metrics.trackHeight}px;
    transition: background 0.25s ease, box-shadow 0.25s ease;
  `;

  const knobClass = css`
    position: absolute;
    top: 50%;
    left: ${small ? 4 : 5}px;
    width: ${metrics.knobSize}px;
    height: ${metrics.knobSize}px;
    border-radius: 50%;
    background: #ffffff;
    transition: transform 0.28s cubic-bezier(0.2, 0.95, 0.48, 1),
      box-shadow 0.28s ease;
    transform: translate(0, -50%);
  `;

  return (
    <ErrorBoundary
      componentPath="SwitchButton"
      style={{
        display: 'flex',
        flexDirection: small ? 'column' : 'row',
        alignItems: 'center',
        gap: small ? '0.6rem' : '1.2rem',
        ...style,
        ...(disabled ? { opacity: 0.35 } : {})
      }}
    >
      {label && (
        <div
          style={{
            marginRight: small ? 0 : '1rem',
            fontWeight: 600,
            ...mergedLabelStyle
          }}
        >
          {label}
        </div>
      )}
      <label
        className={css`
          position: relative;
          display: inline-block;
        `}
        style={{
          width: metrics.trackWidth,
          height: metrics.trackHeight,
          cursor: disabled ? 'default' : 'pointer'
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onChange();
          }
        }}
      >
        <input
          className={visuallyHiddenInput}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          aria-label={srLabel}
          disabled={disabled}
          checked={checked}
          onChange={disabled ? () => null : onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <span
          className={trackBaseClass}
          style={{
            background: checked ? palette.active.bg : palette.inactive.bg,
            boxShadow: composeShadows(
              checked ? palette.active.shadow : palette.inactive.shadow,
              isFocused ? palette.active.focus(metrics.focusOffset) : ''
            )
          }}
          onClick={(event) => {
            event.preventDefault();
            if (disabled) return;
            onChange();
          }}
        >
          <span
            className={knobClass}
            style={{
              transform: `translate(${
                checked ? metrics.knobTranslate : 0
              }px, -50%)`,
              boxShadow: checked
                ? palette.active.knobShadow
                : palette.inactive.knobShadow
            }}
          />
        </span>
      </label>
    </ErrorBoundary>
  );
}

const visuallyHiddenInput = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

function composeShadows(...parts: string[]) {
  return parts.filter(Boolean).join(', ') || 'none';
}

interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

function createPalette(color: string) {
  const parsed = parseColor(color);
  if (!parsed) {
    return {
      active: {
        bg: color,
        shadow: '0 10px 20px -14px rgba(15, 23, 42, 0.3)',
        knobShadow: '0 6px 12px rgba(15, 23, 42, 0.16)',
        focus: (radius: number) => `0 0 0 ${radius}px rgba(59, 130, 246, 0.45)`
      },
      inactive: {
        bg: 'rgba(148, 163, 184, 0.35)',
        shadow: 'inset 0 2px 4px rgba(15, 23, 42, 0.12)',
        knobShadow: '0 6px 12px rgba(15, 23, 42, 0.16)'
      }
    };
  }

  const lighten = mixWith(parsed, white, 0.35);
  const hoverLighten = mixWith(parsed, white, 0.25);
  const darken = mixWith(parsed, black, 0.15);
  const focusColor = toRgba({ ...parsed, a: 0.4 });

  return {
    active: {
      bg: `linear-gradient(135deg, ${toRgba(lighten)} 0%, ${toRgba(
        parsed
      )} 100%)`,
      shadow: `0 12px 24px -18px ${toRgba({ ...parsed, a: 0.65 })}`,
      knobShadow: `0 10px 16px -8px ${toRgba({ ...parsed, a: 0.55 })}`,
      focus: (radius: number) => `0 0 0 ${radius}px ${focusColor}`,
      hoverBg: `linear-gradient(135deg, ${toRgba(hoverLighten)} 0%, ${toRgba(
        darken
      )} 100%)`
    },
    inactive: {
      bg: 'rgba(148, 163, 184, 0.38)',
      shadow: 'inset 0 2px 4px rgba(15, 23, 42, 0.12)',
      knobShadow: '0 6px 12px rgba(15, 23, 42, 0.18)'
    }
  };
}

const white: RGBA = { r: 255, g: 255, b: 255, a: 1 };
const black: RGBA = { r: 0, g: 0, b: 0, a: 1 };

function parseColor(color: string): RGBA | null {
  if (!color) return null;
  const rgbaMatch = color.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)$/
  );
  if (rgbaMatch) {
    const [, r, g, b, a] = rgbaMatch;
    return {
      r: clamp(Number(r), 0, 255),
      g: clamp(Number(g), 0, 255),
      b: clamp(Number(b), 0, 255),
      a: typeof a === 'undefined' ? 1 : clamp(Number(a), 0, 1)
    };
  }
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1
      };
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a:
          hex.length === 8
            ? clamp(parseInt(hex.slice(6, 8), 16) / 255, 0, 1)
            : 1
      };
    }
  }
  return null;
}

function mixWith(base: RGBA, target: RGBA, amount: number): RGBA {
  const mix = clamp(amount, 0, 1);
  return {
    r: Math.round(base.r + (target.r - base.r) * mix),
    g: Math.round(base.g + (target.g - base.g) * mix),
    b: Math.round(base.b + (target.b - base.b) * mix),
    a: base.a + (target.a - base.a) * mix
  };
}

function toRgba(color: RGBA) {
  return `rgba(${clamp(color.r, 0, 255)}, ${clamp(color.g, 0, 255)}, ${clamp(
    color.b,
    0,
    255
  )}, ${clamp(color.a, 0, 1)})`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
