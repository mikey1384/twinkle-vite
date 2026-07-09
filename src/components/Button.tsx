import React, { CSSProperties, ReactNode, useMemo } from 'react';
import { css, cx } from '@emotion/css';
import { Color, mobileMaxWidth, borderRadius } from '~/constants/css';
import Icon from '~/components/Icon';

type Variant = 'solid' | 'soft' | 'outline' | 'ghost';
type Shape = 'rounded' | 'pill';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  className?: string;
  color?: string; // a key in `Color` (e.g. 'logoBlue'); defaults per variant
  disabled?: boolean;
  disabledOpacity?: number; // defaults to 0.5
  loading?: boolean;
  onClick: (arg?: any) => any;
  children?: ReactNode;
  hoverColor?: string; // a key in `Color`; defaults to `color`
  stretch?: boolean; // full width; does not affect shape/radius
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: CSSProperties;
  mobilePadding?: string;
  mobileBorderRadius?: string;
  variant?: Variant; // defaults to 'solid'
  shape?: Shape; // defaults to 'rounded'
  size?: Size; // defaults to 'md'
  uppercase?: boolean; // defaults to true
  tone?: 'flat' | 'raised';
}

// alpha applied to the button's color per variant; null means `transparent`
const VARIANT_ALPHAS: Record<
  Variant,
  { bg: number | null; border: number | null; hoverBg: number; hoverBorder: number }
> = {
  solid: { bg: 1, border: 1, hoverBg: 0.9, hoverBorder: 0.9 },
  soft: { bg: 0.12, border: 0.28, hoverBg: 0.18, hoverBorder: 0.32 },
  outline: { bg: null, border: 0.5, hoverBg: 0.08, hoverBorder: 0.6 },
  ghost: { bg: null, border: null, hoverBg: 0.08, hoverBorder: 0.28 }
};

function tint(key: string, a: number) {
  const fn = (Color as any)[key];
  return typeof fn === 'function' ? fn(a) : key;
}

export default function Button(props: ButtonProps) {
  const {
    'aria-label': ariaLabel,
    'aria-pressed': ariaPressed,
    className = '',
    color,
    disabled,
    disabledOpacity = 0.5,
    loading,
    onClick,
    children,
    hoverColor,
    stretch,
    onMouseEnter = () => null,
    onMouseLeave = () => null,
    style = {},
    mobilePadding,
    mobileBorderRadius,
    variant,
    shape = 'rounded',
    size = 'md',
    uppercase = true,
    tone
  } = props;

  const isDisabled = !!(disabled || loading);
  const resolvedVariant: Variant = variant || 'solid';
  const resolvedTone = tone || 'flat';

  const baseColorKey =
    color || (resolvedVariant === 'ghost' ? 'darkerGray' : 'black');
  const hoverColorKey = hoverColor || baseColorKey;

  const sizeFont =
    size === 'sm' ? '1.3rem' : size === 'lg' ? '1.7rem' : '1.5rem';
  const padY = size === 'sm' ? '0.7rem' : size === 'lg' ? '1.1rem' : '1rem';
  const padX = size === 'sm' ? '0.9rem' : size === 'lg' ? '1.3rem' : '1rem';
  const radius = shape === 'pill' ? '9999px' : borderRadius;

  const cssClass = useMemo(() => {
    const v = resolvedVariant;
    const alphas = VARIANT_ALPHAS[v];
    const baseIsWhite = baseColorKey === 'white';

    const bg = alphas.bg === null ? 'transparent' : tint(baseColorKey, alphas.bg);
    const hoverBg = tint(hoverColorKey, alphas.hoverBg);

    let border =
      alphas.border === null ? 'transparent' : tint(baseColorKey, alphas.border);
    let hoverBorder = tint(hoverColorKey, alphas.hoverBorder);
    if (baseIsWhite && v !== 'ghost') {
      border = tint('borderGray', 1);
      hoverBorder = tint('darkerBorderGray', 1);
    }

    const textColor = baseIsWhite
      ? tint('darkerGray', 1)
      : v === 'solid'
      ? '#fff'
      : tint(baseColorKey, 1);
    // solid keeps its text color on hover, so this is only read by the others
    const hoverTextColor =
      hoverColorKey === 'white' ? tint('darkerGray', 1) : tint(hoverColorKey, 1);

    const skeuoBox =
      resolvedTone === 'raised'
        ? `box-shadow: 0 1px 2px rgba(15,23,42,0.08), 0 8px 16px rgba(15,23,42,0.08);`
        : '';

    return css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: ${isDisabled ? 'default' : 'pointer'};
      font-family: 'Ubuntu', sans-serif, Arial, Helvetica;
      text-transform: ${uppercase ? 'uppercase' : 'none'};
      font-weight: 700;
      line-height: 1.2;
      font-size: ${sizeFont};
      padding: ${padY} ${padX};
      color: ${textColor};
      background: ${bg};
      border: 1px solid ${border};
      border-radius: ${radius};
      transition: background 0.18s ease, color 0.18s ease,
        border-color 0.18s ease, box-shadow 0.18s ease;
      ${stretch ? 'width: 100%;' : ''}
      ${isDisabled ? `opacity: ${disabledOpacity}; pointer-events: none;` : ''}
      ${skeuoBox}

      /* Better tap feel on mobile */
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;

      /* outline rather than box-shadow, so a raised button keeps its shadow
         while focused. Matches the focus treatment in components/Modal. */
      &:focus-visible {
        outline: 2px solid ${Color.logoBlue()};
        outline-offset: 2px;
      }

      @media (hover: hover) and (pointer: fine) {
        &:hover {
          background: ${hoverBg};
          border-color: ${hoverBorder};
          ${v !== 'solid' ? `color: ${hoverTextColor};` : ''}
        }
      }

      @media (max-width: ${mobileMaxWidth}) {
        font-size: ${size === 'lg' ? '1.5rem' : '1.3rem'};
        padding: ${mobilePadding ?? `${padY} ${padX}`};
        border-radius: ${mobileBorderRadius || radius};
      }
    `;
  }, [
    resolvedVariant,
    baseColorKey,
    hoverColorKey,
    resolvedTone,
    isDisabled,
    uppercase,
    sizeFont,
    padY,
    padX,
    radius,
    stretch,
    disabledOpacity,
    size,
    mobilePadding,
    mobileBorderRadius
  ]);

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      style={style}
      className={cx(cssClass, className, 'unselectable')}
      onClick={isDisabled ? undefined : (e) => onClick(e)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
      {loading && (
        <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
      )}
    </button>
  );
}
