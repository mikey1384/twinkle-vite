import React, { useMemo } from 'react';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { returnTheme } from '~/helpers';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import ScopedTheme from '~/theme/ScopedTheme';

export default function FilterBar({
  color,
  bordered,
  className,
  children,
  innerRef,
  inverted,
  dropdownButton,
  style
}: {
  color?: string;
  bordered?: boolean;
  className?: string;
  children?: React.ReactNode;
  innerRef?: React.RefObject<any>;
  inverted?: boolean;
  dropdownButton?: any;
  style?: React.CSSProperties;
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = (color || profileTheme) as string;
  const themeRoles = useMemo(() => returnTheme(themeName), [themeName]);

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

  const filterTextShadowColor = themeRoles.filterText?.shadow
    ? resolveColor(themeRoles.filterText?.shadow, undefined, '') || ''
    : '';

  const filterActiveColorValue =
    resolveColor(
      themeRoles.filterActive?.color,
      undefined,
      themeRoles.filter?.color ?? themeName
    ) || filterColorValue;

  const invertedFilterActiveColorValue =
    resolveColor(
      themeRoles.invertedFilterActive?.color,
      undefined,
      themeRoles.filter?.color ?? themeName
    ) || filterColorValue;

  const alertColorValue =
    resolveColor(themeRoles.alert?.color, undefined, 'gold') || Color.gold();

  const filterColorVar = `var(--role-filter-color, ${filterColorValue})`;
  const filterTextColorVar = `var(--role-filterText-color, ${filterTextColorValue})`;
  const filterTextShadowVar = `var(--role-filterText-shadow, ${
    filterTextShadowColor || 'transparent'
  })`;
  const filterActiveColorVar = `var(--role-filterActive-color, ${filterActiveColorValue})`;
  const invertedFilterActiveColorVar = `var(--role-invertedFilterActive-color, ${invertedFilterActiveColorValue})`;
  const alertColorVar = `var(--role-alert-color, ${alertColorValue})`;

  const filterBarClass = css`
    background: ${inverted ? filterColorVar : '#fff'};
    height: 6rem;
    margin-bottom: 1rem;
    ${!inverted && bordered
      ? `
        border-top: 1px solid ${Color.borderGray()};
        border-left: 1px solid ${Color.borderGray()};
        border-right: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        `
      : ''};
    display: flex;
    font-size: 1.7rem;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    > .filter-section {
      width: 30%;
      height: 100%;
      padding: 0.5rem 1rem;
      display: flex;
      justify-content: flex-end;
      border-bottom: ${inverted ? '' : `1px solid ${Color.borderGray()}`};
    }
    > .nav-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100%;
      width: ${!dropdownButton ? '100%' : '70%'};
      > nav {
        font-family: 'Ubuntu', sans-serif, Arial, Helvetica;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        border-bottom: ${inverted ? '' : `1px solid ${Color.borderGray()}`};
        color: ${inverted ? filterTextColorVar : Color.gray()};
        > a {
          color: ${inverted ? filterTextColorVar : Color.gray()};
          text-decoration: none;
        }
        &.alert {
          color: ${alertColorVar}!important;
        }
        &.super-alert {
          animation: colorChange 6s infinite alternate !important;
        }
      }
      > nav.active {
        background: ${inverted ? invertedFilterActiveColorVar : 'transparent'};
        border-bottom: ${inverted ? '' : `3px solid ${filterActiveColorVar}`};
        color: ${inverted ? filterTextColorVar : filterActiveColorVar};
        text-shadow: ${inverted
          ? filterTextShadowColor
            ? `0 1px ${filterTextShadowVar}`
            : 'none'
          : 'none'};
        > a {
          color: ${inverted ? filterTextColorVar : filterActiveColorVar};
        }
        @media (max-width: ${mobileMaxWidth}) {
          border-bottom: ${inverted ? '' : `2px solid ${filterActiveColorVar}`};
        }
      }
      > nav.active.alert {
        border-bottom: 3px solid ${alertColorVar}!important;
      }
      > nav.active.super-alert {
        animation: colorAndBorderChange 6s infinite alternate !important;
      }
      > nav:first-of-type {
        ${!inverted && bordered
          ? `border-bottom-left-radius: ${borderRadius};`
          : ''} @media (max-width: ${mobileMaxWidth}) {
          border-bottom-left-radius: 0;
        }
      }
      > nav:last-child {
        @media (max-width: ${mobileMaxWidth}) {
          border-bottom-right-radius: 0;
        }
        ${!inverted && bordered && !dropdownButton
          ? `border-bottom-right-radius: ${borderRadius};`
          : ''};
      }
      @media (hover: hover) and (pointer: fine) {
        > nav:hover {
          background: ${inverted
            ? invertedFilterActiveColorVar
            : 'transparent'};
          color: ${inverted ? filterTextColorVar : filterActiveColorVar};
          text-shadow: ${inverted
            ? filterTextShadowColor
              ? `0 1px ${filterTextShadowVar}`
              : 'none'
            : 'none'};
          border-bottom: ${inverted ? '' : `3px solid ${filterActiveColorVar}`};
          &.alert {
            color: ${alertColorVar}!important;
            border-bottom: 3px solid ${alertColorVar}!important;
          }
          &.super-alert {
            animation: colorAndBorderChange 6s infinite alternate !important;
          }
          > a {
            color: ${inverted ? filterTextColorVar : filterActiveColorVar};
            font-weight: bold;
          }
        }
      }
    }
    @media (max-width: ${mobileMaxWidth}) {
      height: 5.5rem;
      border-radius: 0;
      border-left: none;
      border-right: none;
    }
    @keyframes colorChange {
      0% {
        color: #6a11cb;
      }
      33% {
        color: #2575fc;
      }
      66% {
        color: #ec008c;
      }
      100% {
        color: #fc6767;
      }
    }
    @keyframes colorAndBorderChange {
      0% {
        color: #6a11cb;
        border-bottom: 3px solid #6a11cb;
      }
      33% {
        color: #2575fc;
        border-bottom: 3px solid #2575fc;
      }
      66% {
        color: #ec008c;
        border-bottom: 3px solid #ec008c;
      }
      100% {
        color: #fc6767;
        border-bottom: 3px solid #fc6767;
      }
    }
  `;

  const innerClassName = className
    ? `${filterBarClass} ${className}`
    : filterBarClass;

  const wrapperClass = css`
    flex: 1 1 0%;
    width: 100%;
    height: 6rem;
    display: flex;
    align-items: stretch;
    @media (max-width: ${mobileMaxWidth}) {
      height: 5.5rem;
    }
  `;

  return (
    <ScopedTheme
      theme={themeName as any}
      roles={[
        'filter',
        'filterText',
        'filterActive',
        'invertedFilterActive',
        'alert'
      ]}
      className={wrapperClass}
      style={style}
    >
      <div ref={innerRef} className={innerClassName}>
        <div className="nav-section">{children}</div>
        {dropdownButton && (
          <div className="filter-section">{dropdownButton}</div>
        )}
      </div>
    </ScopedTheme>
  );
}
