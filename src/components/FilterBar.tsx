import React from 'react';
import { Color, mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { css } from '@emotion/css';
import ScopedTheme from '~/theme/ScopedTheme';
import { useRoleColor } from '~/theme/useRoleColor';

interface FilterBarProps {
  color?: string;
  className?: string;
  children?: React.ReactNode;
  innerRef?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  bordered?: boolean;
}

export default function FilterBar({
  color,
  className,
  children,
  innerRef,
  style,
  bordered = false
}: FilterBarProps) {
  const { color: alertRoleColor, themeName: resolvedThemeName } = useRoleColor(
    'alert',
    {
      themeName: color,
      fallback: 'gold'
    }
  );
  const { getColor: getFilterColor } = useRoleColor('filter', {
    themeName: color,
    fallback: 'logoBlue'
  });

  const alertColorVar = `var(--role-alert-color, ${alertRoleColor})`;
  const isVanta = resolvedThemeName === 'vantaBlack';

  // Surface and text (single design: underline tabs)
  const barBackground = '#fff';
  // no borders
  const navTextColor = Color.darkGray();
  const navHoverColor = Color.darkBlueGray();
  const activeTextColor = getFilterColor() || Color.logoBlue();

  const themeHoverBorderValue = isVanta
    ? 'rgba(0, 0, 0, 0.18)'
    : getFilterColor(0.28) || Color.logoBlue(0.28);

  // Make the selected tab underline opaque
  const tabActiveBorder = getFilterColor() || Color.logoBlue();

  const formatCssValue = (
    value: React.CSSProperties[keyof React.CSSProperties] | undefined,
    fallback: string
  ) => {
    if (value === undefined) return fallback;
    if (typeof value === 'number') return `${value}px`;
    return value;
  };

  const { height, fontSize, ...styleRest } = style || {};
  const resolvedHeight = formatCssValue(height, '4.8rem');
  const resolvedFontSize = formatCssValue(fontSize, '1.5rem');

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
    padding: 0.8rem 1.6rem;
    min-height: ${resolvedHeight};
    font-size: ${resolvedFontSize};
    background: ${barBackground};
    overflow: visible;
    border-radius: ${wideBorderRadius};
    border: ${bordered ? '1px solid var(--ui-border)' : 'none'};

    > .nav-section {
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    > .nav-section::-webkit-scrollbar {
      display: none;
    }

    > .nav-section > nav {
      position: relative;
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.8rem 1.4rem;
      font-weight: 600;
      color: ${navTextColor};
      background: transparent;
      cursor: pointer;
      transition: color 0.2s ease;
      white-space: nowrap;
      border-bottom: 2px solid transparent;
    }

    > .nav-section > nav > a {
      color: inherit;
      text-decoration: none;
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
        border-bottom-color: ${themeHoverBorderValue};
      }
    }

    > .nav-section > nav.active {
      color: ${activeTextColor};
      border-bottom-color: ${tabActiveBorder};
    }

    > .nav-section > nav.active.alert {
      color: ${alertColorVar};
      border-bottom-color: ${alertColorVar};
    }

    > .nav-section > nav.active.super-alert {
      animation: colorAndBorderChange 6s infinite alternate;
      box-shadow: none !important; /* prevent weird left shadow glow */
    }

    @media (max-width: ${mobileMaxWidth}) {
      flex-direction: column;
      align-items: stretch;
      gap: 0.8rem;
      padding: 0.8rem;
      border-radius: 0;

      > .nav-section {
        width: 100%;
      }

      > .nav-section > nav {
        flex: 1;
        padding: 1rem;
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
      }
      25% {
        color: #2cb1ff;
        border-color: #2cb1ff;
      }
      50% {
        color: #3ddc97;
        border-color: #3ddc97;
      }
      75% {
        color: #ffb400;
        border-color: #ffb400;
      }
      100% {
        color: #ff4f8b;
        border-color: #ff4f8b;
      }
    }
  `;

  const innerClassName = className
    ? `${filterBarClass} ${className}`
    : filterBarClass;

  const scopedThemeStyle =
    styleRest && Object.keys(styleRest).length
      ? (styleRest as React.CSSProperties)
      : undefined;

  return (
    <ScopedTheme
      theme={resolvedThemeName as any}
      roles={['filter', 'filterText', 'filterActive', 'alert']}
      className={wrapperClass}
      style={scopedThemeStyle}
    >
      <div ref={innerRef as any} className={innerClassName}>
        <div className="nav-section">{children}</div>
      </div>
    </ScopedTheme>
  );
}
