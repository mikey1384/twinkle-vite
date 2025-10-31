import React, { useMemo } from 'react';
import {
  Color,
  getThemeStyles,
  mobileMaxWidth,
  wideBorderRadius
} from '~/constants/css';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';

export default function SideMenu({
  children,
  className,
  style,
  theme,
  variant = 'default',
  placement = 'left',
  positionMode = 'fixed',
  topOffset,
  rightOffset,
  leftOffset
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  theme?: string;
  variant?: 'default' | 'card';
  placement?: 'left' | 'right';
  positionMode?: 'fixed' | 'sticky' | 'static';
  topOffset?: string;
  rightOffset?: string;
  leftOffset?: string;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  // Allow explicit theme override (e.g., viewing another user's profile)
  // On profile routes, prefer a route-specific override on reloads
  let routeTheme: string | null = null;
  try {
    const path = window.location?.pathname || '';
    if (path.startsWith('/users/')) {
      routeTheme = localStorage.getItem('routeProfileTheme');
    }
  } catch (_err) {}
  const themeName = (theme || routeTheme || profileTheme || 'logoBlue') as string;
  const isVanta = themeName === 'vantaBlack';
  const isCardVariant = variant === 'card';
  const isRight = placement === 'right';

  const themeBg = useMemo(
    () => getThemeStyles(themeName, 0.06).bg,
    [themeName]
  );
  const hoverBg = useMemo(
    () => getThemeStyles(themeName, 0.12).bg,
    [themeName]
  );
  const homeMenuItemActiveRole = useRoleColor('homeMenuItemActive', {
    themeName,
    fallback: themeName || 'logoBlue'
  });
  const activeAccent =
    isVanta ? '#ffffff' : homeMenuItemActiveRole.getColor() || Color.logoBlue();
  const activeBlockBg = isVanta
    ? 'rgba(0,0,0,0.7)'
    : homeMenuItemActiveRole.getColor(0.22) || Color.highlightGray();
  const hoverAccent =
    homeMenuItemActiveRole.getColor() || Color.logoBlue();
  const outlineAccent = isVanta
    ? 'rgba(0,0,0,0.9)'
    : homeMenuItemActiveRole.getColor(0.4) || 'var(--ui-border)';
  const hoverTranslate = isRight ? '-4px' : '4px';

  return (
    <div
      style={style}
      className={`${className ? `${className} ` : ''}${css`
        ${positionMode === 'sticky'
          ? `position: sticky; top: ${topOffset ?? '1rem'};`
          : positionMode === 'static'
          ? `position: static;`
          : `position: fixed; top: ${topOffset ?? 'CALC(50vh - 11rem)'}; ${
              isRight
                ? `right: ${rightOffset ?? '2rem'};`
                : `left: ${leftOffset ?? '2rem'};`
            }`}
        height: auto;
        width: 19rem;
        display: flex;
        z-index: 20;
        justify-content: ${isCardVariant
          ? isRight
            ? 'flex-end'
            : 'flex-start'
          : 'center'};
        align-items: ${isCardVariant
          ? isRight
            ? 'flex-end'
            : 'flex-start'
          : 'center'};
        flex-direction: column;
        font-size: 2rem;
        background: ${isCardVariant ? themeBg : 'transparent'};
        border-radius: ${isCardVariant ? wideBorderRadius : 0};
        border: none;
        padding: ${isCardVariant ? '1.2rem 0 1.4rem' : 0};
        box-shadow: ${isCardVariant
          ? '0 20px 38px -28px rgba(15, 23, 42, 0.2)'
          : 'none'};

        > nav {
          ${isCardVariant
            ? `
          margin: 0.6rem 1rem;
          padding: 1rem 1.3rem;
          border-radius: ${wideBorderRadius};
          background: transparent;
          border: 1px solid transparent;
          box-shadow: none;
          `
            : `
          padding: 1.5rem;
          `}
          cursor: pointer;
          display: flex;
          align-items: center;
          text-align: ${isRight ? 'right' : 'center'};
          width: 100%;
          justify-content: ${isRight ? 'flex-end' : 'center'};
          flex-direction: row;
          padding-inline: ${isCardVariant ? '1.6rem' : '1.5rem'};
          color: ${Color.darkGray()};
          text-decoration: none;
          gap: 0.8rem;
          transition: background 0.18s ease, color 0.18s ease,
            border-color 0.18s ease, box-shadow 0.18s ease,
            transform 0.06s ease;
        }
        @media (hover: hover) and (pointer: fine) {
        > nav:hover {
          ${isCardVariant
            ? `
          background: ${isVanta ? 'rgba(0,0,0,0.06)' : hoverBg};
          border-color: ${outlineAccent};
          color: ${isVanta ? Color.darkGray() : hoverAccent};
          box-shadow: 0 12px 20px -14px rgba(15,23,42,0.22);
          transform: translateX(${hoverTranslate});
          `
            : `
          font-weight: bold;
          color: ${Color.black()};
          `}
        }
        }
        > nav.active {
          ${isCardVariant
            ? `
          background: ${activeBlockBg};
          border-color: ${outlineAccent};
          color: ${activeAccent};
          box-shadow: 0 16px 26px -18px ${outlineAccent};
          `
            : `
          font-weight: bold;
          color: ${Color.black()};
          `}
        }
        > a {
          ${isCardVariant
            ? `
          margin: 0.6rem 1rem;
          padding: 1rem 1.3rem;
          border-radius: ${wideBorderRadius};
          background: transparent;
          border: 1px solid transparent;
          box-shadow: none;
          `
            : `
          padding: 1.5rem;
          `}
          cursor: pointer;
          display: flex;
          align-items: center;
          text-align: center;
          width: 100%;
          justify-content: center;
          color: ${Color.darkGray()};
          text-decoration: none;
          gap: 0.8rem;
          transition: background 0.18s ease, color 0.18s ease,
            border-color 0.18s ease, box-shadow 0.18s ease,
            transform 0.06s ease;
        }
        @media (hover: hover) and (pointer: fine) {
        > a:hover {
          ${isCardVariant
            ? `
          background: ${isVanta ? 'rgba(0,0,0,0.06)' : hoverBg};
          border-color: ${outlineAccent};
          color: ${isVanta ? Color.darkGray() : hoverAccent};
          box-shadow: 0 12px 20px -14px rgba(15,23,42,0.22);
          transform: translateX(${hoverTranslate});
          `
            : `
          font-weight: bold;
          color: ${Color.black()};
          `}
        }
        }
        > a.active {
          ${isCardVariant
            ? `
          background: ${activeBlockBg};
          border-color: ${outlineAccent};
          color: ${activeAccent};
          box-shadow: 0 16px 26px -18px ${outlineAccent};
          `
            : `
          font-weight: bold;
          color: ${Color.black()};
          `}
        }
        @media (max-width: ${mobileMaxWidth}) {
          display: none;
        }
      `}`}
    >
      {children}
    </div>
  );
}
