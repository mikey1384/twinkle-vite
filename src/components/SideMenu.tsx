import React, { useMemo } from 'react';
import {
  Color,
  getThemeStyles,
  mobileMaxWidth,
  wideBorderRadius
} from '~/constants/css';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';

export default function SideMenu({
  children,
  className,
  style,
  variant = 'default'
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'default' | 'card';
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const activeColorName = useKeyContext(
    (v) => v.theme.homeMenuItemActive.color
  );
  const themeName = (profileTheme || 'logoBlue') as string;
  const isCardVariant = variant === 'card';

  const themeBg = useMemo(
    () => getThemeStyles(themeName, 0.06).bg,
    [themeName]
  );
  const hoverBg = useMemo(
    () => getThemeStyles(themeName, 0.12).bg,
    [themeName]
  );
  const activeColorFn = Color[activeColorName as keyof typeof Color];
  const activeAccent =
    typeof activeColorFn === 'function'
      ? (activeColorFn as (opacity?: number) => string)()
      : Color.logoBlue();
  const activeBlockBg =
    typeof activeColorFn === 'function'
      ? (activeColorFn as (opacity?: number) => string)(0.22)
      : Color.highlightGray();
  const hoverAccent =
    typeof activeColorFn === 'function'
      ? (activeColorFn as (opacity?: number) => string)()
      : Color.logoBlue();
  const outlineAccent =
    typeof activeColorFn === 'function'
      ? (activeColorFn as (opacity?: number) => string)(0.4)
      : Color.borderGray();

  return (
    <div
      style={style}
      className={`${className ? `${className} ` : ''}${css`
        top: CALC(50vh - 11rem);
        height: auto;
        width: 19rem;
        display: flex;
        position: fixed;
        z-index: 20;
        justify-content: ${isCardVariant ? 'flex-start' : 'center'};
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
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(148,163,184,0.35);
          box-shadow: 0 1px 2px rgba(15,23,42,0.08),
                      0 8px 16px rgba(15,23,42,0.08);
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
        > nav:hover {
          ${isCardVariant
            ? `
          background: ${hoverBg};
          border-color: ${hoverAccent};
          color: ${hoverAccent};
          box-shadow: 0 12px 20px -14px rgba(15,23,42,0.22);
          transform: translateX(4px);
          `
            : `
          font-weight: bold;
          color: ${Color.black()};
          `}
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
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(148,163,184,0.35);
          box-shadow: 0 1px 2px rgba(15,23,42,0.08),
                      0 8px 16px rgba(15,23,42,0.08);
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
        > a:hover {
          ${isCardVariant
            ? `
          background: ${hoverBg};
          border-color: ${hoverAccent};
          color: ${hoverAccent};
          box-shadow: 0 12px 20px -14px rgba(15,23,42,0.22);
          transform: translateX(4px);
          `
            : `
          font-weight: bold;
          color: ${Color.black()};
          `}
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
