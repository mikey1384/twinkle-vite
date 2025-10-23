import React, { CSSProperties, ReactNode, useMemo } from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import Icon from '~/components/Icon';

type Variant = 'solid' | 'soft' | 'outline' | 'ghost';
type Shape = 'rounded' | 'pill';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  className?: string;
  color?: string; // color key in Color or 'theme'
  disabled?: boolean;
  disabledOpacity?: number;
  loading?: boolean;
  onClick: (arg?: any) => any;
  children?: ReactNode;
  hoverColor?: string; // optional override
  stretch?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: CSSProperties;
  mobilePadding?: string;
  mobileBorderRadius?: string;
  // New API
  variant?: Variant; // supports 'solid' | 'soft' | 'outline'
  shape?: Shape; // defaults to 'rounded'
  size?: Size; // defaults to 'md'
  uppercase?: boolean; // defaults to true
  // Legacy (kept for compatibility with existing call sites)
  filled?: boolean;
  onHover?: boolean; // ignored
  // New optional tone for slight elevation without shadows everywhere
  tone?: 'flat' | 'raised';
}

export default function Button(props: ButtonProps) {
  const {
    className = '',
    color = 'black',
    disabled,
    disabledOpacity = 0.2,
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
    // New
    variant,
    shape = 'rounded',
    size = 'md',
    uppercase = true,
    tone
  } = props;

  const isDisabled = useMemo(
    () => !!(disabled || loading),
    [disabled, loading]
  );
  const finalChildren = useMemo(
    () => React.Children.toArray(children),
    [children]
  );

  // Resolve variant: 'solid' | 'soft' | 'outline' (ghost when transparent)
  const resolvedVariant: Variant = useMemo(() => {
    return (variant || 'solid') as Variant;
  }, [variant]);
  const resolvedTone = useMemo(() => {
    if (tone) return tone;
    return 'flat';
  }, [tone]);

  const baseColorKey = color || 'black';
  const hoverColorKey = hoverColor || baseColorKey;
  const baseIsTheme = baseColorKey === 'theme';
  const hoverIsTheme = hoverColorKey === 'theme';

  const sizeFont =
    size === 'sm' ? '1.3rem' : size === 'lg' ? '1.7rem' : '1.5rem';
  const padY = size === 'sm' ? '0.7rem' : size === 'lg' ? '1.1rem' : '1rem';
  const padX = size === 'sm' ? '0.9rem' : size === 'lg' ? '1.3rem' : '1rem';
  const radius = shape === 'pill' ? '9999px' : wideBorderRadius;

  function tint(key: string, a: number) {
    const fn = (Color as any)[key];
    return typeof fn === 'function' ? fn(a) : key;
  }

  const cssClass = useMemo(() => {
    const v = resolvedVariant;

    // Tokens per variant
    const solidBg = baseIsTheme ? 'var(--theme-bg)' : tint(baseColorKey, 1);
    const solidBorder = baseIsTheme
      ? 'var(--theme-border)'
      : tint(baseColorKey, 1);
    const solidHoverBg = hoverIsTheme
      ? 'var(--theme-hover-bg)'
      : tint(hoverColorKey, 0.9);
    const solidHoverBorder = solidHoverBg;

    // Soft tokens
    const softBg = baseIsTheme ? 'var(--theme-bg)' : tint(baseColorKey, 0.12);
    const softBorder = baseIsTheme
      ? 'var(--theme-border)'
      : tint(baseColorKey, 0.28);
    const softHoverBg = hoverIsTheme
      ? 'var(--theme-hover-bg)'
      : tint(hoverColorKey, 0.18);
    const softHoverBorder = hoverIsTheme
      ? 'var(--theme-hover-bg)'
      : tint(hoverColorKey, 0.32);

    const outlineBg = 'transparent';
    const outlineBorder = baseIsTheme
      ? 'var(--theme-border)'
      : tint(baseColorKey, 0.5);
    const outlineHoverBg = hoverIsTheme
      ? 'var(--theme-hover-bg)'
      : tint(hoverColorKey, 0.08);
    const outlineHoverBorder = hoverIsTheme
      ? 'var(--theme-hover-bg)'
      : tint(hoverColorKey, 0.6);

    const ghostBg = 'transparent';
    const ghostBorder = 'transparent';
    const ghostHoverBg = hoverIsTheme
      ? 'var(--theme-hover-bg)'
      : tint(hoverColorKey, 0.08);
    const ghostHoverBorder = hoverIsTheme
      ? 'var(--theme-hover-bg)'
      : tint(hoverColorKey, 0.28);

    // Background / Border / Text
    const bg =
      v === 'solid'
        ? solidBg
        : v === 'soft'
        ? softBg
        : v === 'outline'
        ? outlineBg
        : ghostBg;
    let border =
      v === 'solid'
        ? solidBorder
        : v === 'soft'
        ? softBorder
        : v === 'outline'
        ? outlineBorder
        : ghostBorder;
    const hoverBg =
      v === 'solid'
        ? solidHoverBg
        : v === 'soft'
        ? softHoverBg
        : v === 'outline'
        ? outlineHoverBg
        : ghostHoverBg;
    let hoverBorder =
      v === 'solid'
        ? solidHoverBorder
        : v === 'soft'
        ? softHoverBorder
        : v === 'outline'
        ? outlineHoverBorder
        : ghostHoverBorder;
    const baseIsWhite = baseColorKey === 'white';
    if (baseIsWhite && v !== 'ghost') {
      // Ensure visible border when using white button color
      border = tint('borderGray', 1);
      hoverBorder = tint('darkerBorderGray', 1);
    }
    const textColor =
      v === 'solid'
        ? baseIsTheme
          ? 'var(--theme-text)'
          : baseIsWhite
          ? tint('darkerGray', 1)
          : '#fff'
        : baseIsTheme
        ? 'var(--theme-text)'
        : baseIsWhite
        ? tint('darkerGray', 1)
        : tint(baseColorKey, 1);
    const hoverTextColor =
      v === 'solid'
        ? textColor
        : hoverIsTheme
        ? 'var(--theme-text)'
        : hoverColorKey === 'white'
        ? tint('darkerGray', 1)
        : tint(hoverColorKey, 1);

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

      &:focus-visible {
        outline: 0;
        box-shadow: 0 0 0 3px
          ${baseIsTheme ? 'var(--theme-hover-bg)' : tint(baseColorKey, 0.32)};
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
        ${stretch ? 'border-radius: 0;' : ''}
      }
    `;
  }, [
    resolvedVariant,
    baseIsTheme,
    baseColorKey,
    hoverIsTheme,
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
      data-filled={resolvedVariant === 'solid' ? 'true' : undefined}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      style={{ ...style, ...(stretch ? { width: '100%' } : {}) }}
      className={`${cssClass} ${className} unselectable`}
      onClick={isDisabled ? undefined : onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {finalChildren}
      {loading && (
        <Icon style={{ marginLeft: '0.7rem' }} icon="spinner" pulse />
      )}
    </button>
  );
}
