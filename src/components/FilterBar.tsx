import React, { useMemo } from 'react';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import ScopedTheme from '~/theme/ScopedTheme';
import { getThemeRoles, ThemeName } from '~/theme/themes';

type FilterBarProps = {
  color?: string;
  bordered?: boolean;
  className?: string;
  children?: React.ReactNode;
  innerRef?: React.Ref<HTMLDivElement>;
  dropdownButton?: React.ReactNode;
  style?: React.CSSProperties;
};

export default function FilterBar({
  color,
  bordered,
  className,
  children,
  innerRef,
  dropdownButton,
  style
}: FilterBarProps) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => ((color || profileTheme || 'logoBlue') as ThemeName),
    [color, profileTheme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);

  const resolveColor = (
    name?: string,
    opacity?: number,
    fallbackName?: string,
    fallbackOpacity: number = 1
  ) => {
    const target = name ?? fallbackName;
    if (!target) return undefined;
    const fn = Color[target as keyof typeof Color];
    return fn ? fn(opacity ?? fallbackOpacity) : target;
  };

  const filterColorValue =
    resolveColor(
      themeRoles.filter?.color,
      themeRoles.filter?.opacity,
      themeName,
      themeRoles.filter?.opacity ?? 1
    ) || Color.logoBlue();

  const filterTextColorValue =
    resolveColor(themeRoles.filterText?.color, undefined, 'gray') ||
    Color.gray();

  const filterActiveColorValue =
    resolveColor(
      themeRoles.filterActive?.color,
      undefined,
      themeRoles.filter?.color ?? themeName
    ) || filterColorValue;

  const alertColorValue =
    resolveColor(themeRoles.alert?.color, undefined, 'gold') || Color.gold();

  const filterColorVar = `var(--role-filter-color, ${filterColorValue})`;
  const filterTextColorVar = `var(--role-filterText-color, ${filterTextColorValue})`;
  const filterActiveColorVar = `var(--role-filterActive-color, ${filterActiveColorValue})`;
  const alertColorVar = `var(--role-alert-color, ${alertColorValue})`;

  const pageBgVar = `var(--page-bg, ${Color.whiteGray()})`;
  // Flat, clean white bar surface regardless of page tint
  const barBackground = '#ffffff';
  const barBorderColor = 'transparent';
  const navTextColor = Color.darkGray();
  const navHoverColor = Color.darkBlueGray();
  const navActiveTextColor = Color.darkBlueGray();

  // Theme-aware fills for hover/active
  const themeHoverBgValue =
    resolveColor(themeRoles.filter?.color, 0.08, themeName, 0.08) ||
    Color.logoBlue(0.08);
  const themeActiveBgValue =
    resolveColor(themeRoles.filter?.color, 0.16, themeName, 0.16) ||
    Color.logoBlue(0.16);
  const themeHoverBorderValue =
    resolveColor(themeRoles.filter?.color, 0.28, themeName, 0.28) ||
    Color.logoBlue(0.28);
  const themeActiveBorderValue =
    resolveColor(themeRoles.filter?.color, 0.4, themeName, 0.4) ||
    Color.logoBlue(0.4);

  // Unselected tabs match the bar background; hover/active use theme tints
  const tabBaseSurface = barBackground;
  const tabBaseBorder = 'transparent';
  const tabHoverSurface = themeHoverBgValue;
  const tabHoverBorder = themeHoverBorderValue;
  const tabActiveSurface = themeActiveBgValue;
  const tabActiveBorder = themeActiveBorderValue;

  // Neumorphic tokens (light mode)
  // No neumorphic shadows; keep it simple
  const lightOutset = '0 0 0 rgba(0,0,0,0)';
  const lightOutsetHover = '0 0 0 rgba(0,0,0,0)';
  const lightOutsetStrong = '0 0 0 rgba(0,0,0,0)';
  const raiseHover = 'none';
  const raiseActive = 'none';

  // Neumorphic shadows (inverted/dark-ish surfaces)
  const darkOutset = '4px 4px 8px rgba(0,0,0,0.3), -4px -4px 8px rgba(255,255,255,0.16)';
  const darkOutsetHover = '6px 6px 12px rgba(0,0,0,0.35), -6px -6px 12px rgba(255,255,255,0.18)';
  const darkOutsetStrong = '8px 8px 16px rgba(0,0,0,0.4), -8px -8px 16px rgba(255,255,255,0.2)';

  const containerShadow = 'none';
  const containerShadowHover = 'none';
  // Flat by default; hovered/active use compact vertical drop shadow
  const tabBaseShadow = 'none';
  const tabHoverShadow = raiseHover;
  const tabActiveShadow = raiseActive;

  const formatCssValue = (
    value: React.CSSProperties[keyof React.CSSProperties] | undefined,
    fallback: string
  ) => {
    if (value === undefined) return fallback;
    if (typeof value === 'number') return `${value}px`;
    return value;
  };

  const { height, fontSize, ...styleRest } = style || {};
  const resolvedHeight = formatCssValue(height, '5.6rem');
  const resolvedFontSize = formatCssValue(fontSize, '1.6rem');
  const navMinHeight = `calc(${resolvedHeight} - 1.8rem)`;

  const wrapperClass = css`
    width: 100%;
    display: block;
    margin-bottom: 1rem;
  `;

  const filterBarClass = css`
      position: relative;
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0 1.2rem;
      min-height: ${resolvedHeight};
      font-size: ${resolvedFontSize};
      background: ${barBackground};
      border-radius: ${wideBorderRadius};
      border: ${bordered ? `1px solid ${barBorderColor}` : '1px solid transparent'};
      box-shadow: ${containerShadow};
      transition: box-shadow 0.2s ease, transform 0.2s ease,
        background 0.2s ease, border-color 0.2s ease;
      overflow: visible;
      isolation: isolate;
      z-index: 0;

      /* No container-wide hover effect */

      > .nav-section {
        flex: 1 1 auto;
        display: flex;
        align-items: stretch;
        justify-content: flex-start;
      gap: 1rem;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      > .nav-section::-webkit-scrollbar {
        display: none;
      }

      > .nav-section > nav {
        position: relative;
        flex: 1 1 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.6rem 1.2rem;
        border-radius: 16px;
        font-family: 'Ubuntu', sans-serif, Arial, Helvetica;
        font-weight: 600;
        letter-spacing: 0.01em;
        color: ${navTextColor};
        background: ${tabBaseSurface};
        border: 1px solid rgba(15,23,42,0.06);
        cursor: pointer;
        transition: color 0.18s ease, filter 0.18s ease,
          background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        text-shadow: none;
        white-space: nowrap;
        line-height: 1;
        min-height: ${navMinHeight};
        box-shadow: ${tabBaseShadow};
        overflow: hidden;
        isolation: isolate;
      }

      > .nav-section > nav > a {
        color: inherit;
        text-decoration: none;
      }

      > .nav-section > nav::after {
        content: none;
      }

      > .nav-section > nav.alert {
        color: ${alertColorVar};
      }

      > .nav-section > nav.super-alert {
        animation: colorChange 6s infinite alternate;
      }

      @media (hover: hover) and (pointer: fine) {
        > .nav-section > nav:not(.active):hover {
          color: ${navHoverColor};
          transform: none;
          filter: none;
        background: ${tabHoverSurface};
        border-color: ${tabHoverBorder};
        box-shadow: ${tabHoverShadow};
        z-index: 2;
        }
      }

      > .nav-section > nav.active {
        color: ${navActiveTextColor};
        transform: none;
        filter: none;
        background: ${tabActiveSurface};
        border-color: ${tabActiveBorder};
        box-shadow: ${tabActiveShadow};
        z-index: 3;
      }

      > .nav-section > nav.active.alert {
        color: ${alertColorVar};
        border-color: ${alertColorVar};
        box-shadow: ${tabActiveShadow};

        &::after {
          background: ${alertColorVar};
        }
      }

      > .nav-section > nav.active.super-alert {
        animation: colorAndBorderChange 6s infinite alternate;
      }

      > .filter-section {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-left: 1.2rem;
        margin-left: 0.4rem;
        border-left: ${dropdownButton ? `1px solid ${Color.borderGray(0.5)}` : 'none'};
        gap: 0.6rem;
        
        /* Filter button: match bar bg always; raise only on hover or when open */
        button {
          background: ${barBackground} !important;
          border-color: transparent !important;
          box-shadow: none !important;
          color: ${navTextColor} !important;
        }

        button:hover {
          background: ${themeHoverBgValue} !important;
          box-shadow: none !important;
          color: ${navHoverColor} !important;
          border-color: ${themeHoverBorderValue} !important;
          z-index: 2;
        }

        button[data-filled='true'] {
          background: ${themeActiveBgValue} !important;
          box-shadow: none !important;
          color: ${navActiveTextColor} !important;
          border-color: ${themeActiveBorderValue} !important;
          z-index: 3;
        }
      }

      @media (max-width: ${mobileMaxWidth}) {
        flex-direction: column;
        align-items: stretch;
        gap: 0.6rem;
        border-radius: 0;

        > .nav-section {
          width: 100%;
        }

        > .nav-section > nav {
          flex: 1 1 auto;
          padding: 0.5rem 0.8rem;
        }

        > .nav-section > nav::after {
          bottom: -0.2rem;
        }

        > .filter-section {
          width: 100%;
          justify-content: flex-start;
          padding-left: 0;
          margin-left: 0;
          border-left: none;
          border-top: ${dropdownButton ? `1px solid ${Color.borderGray(0.5)}` : 'none'};
          padding-top: ${dropdownButton ? '0.5rem' : 0};
        }
      }

      @keyframes colorChange {
        0% {
          color: #7f5af0;
        }
        25% {
          color: #2cb1ff;
        }
        50% {
          color: #3ddc97;
        }
        75% {
          color: #ffb400;
        }
        100% {
          color: #ff4f8b;
        }
      }

      @keyframes colorAndBorderChange {
        0% {
          color: #7f5af0;
          border-color: #7f5af0;
          box-shadow: 0 14px 32px rgba(127, 90, 240, 0.35);
        }
        25% {
          color: #2cb1ff;
          border-color: #2cb1ff;
          box-shadow: 0 14px 32px rgba(44, 177, 255, 0.35);
        }
        50% {
          color: #3ddc97;
          border-color: #3ddc97;
          box-shadow: 0 14px 32px rgba(61, 220, 151, 0.35);
        }
        75% {
          color: #ffb400;
          border-color: #ffb400;
          box-shadow: 0 14px 32px rgba(255, 180, 0, 0.35);
        }
        100% {
          color: #ff4f8b;
          border-color: #ff4f8b;
          box-shadow: 0 14px 32px rgba(255, 79, 139, 0.35);
        }
      }

    `;

  const innerClassName = className
    ? `${filterBarClass} ${className}`
    : filterBarClass;

  const scopedThemeStyle = styleRest && Object.keys(styleRest).length
    ? (styleRest as React.CSSProperties)
    : undefined;

  return (
    <ScopedTheme
      theme={themeName as any}
      roles={['filter', 'filterText', 'filterActive', 'alert']}
      className={wrapperClass}
      style={scopedThemeStyle}
    >
      <div ref={innerRef as any} className={innerClassName}>
        <div className="nav-section">{children}</div>
        {dropdownButton ? (
          <div className="filter-section">{dropdownButton}</div>
        ) : null}
      </div>
    </ScopedTheme>
  );
}
