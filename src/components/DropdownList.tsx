import React, { useMemo, useRef } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { createPortal } from 'react-dom';
import { useOutsideTap, useOutsideClick } from '~/helpers/hooks';
import { isMobile } from '~/helpers';
import { useRoleColor } from '~/theme/useRoleColor';

const deviceIsMobile = isMobile(navigator);
const outsideClickMethod = deviceIsMobile ? useOutsideTap : useOutsideClick;

export default function DropdownList({
  xAdjustment = 0,
  children,
  className,
  dropdownContext,
  innerRef,
  style = {},
  onHideMenu = () => null,
  onMouseEnter = () => null,
  onMouseLeave = () => null,
  zIndex = 100_000_000_000
}: {
  xAdjustment?: number;
  children: React.ReactNode;
  className?: string;
  dropdownContext: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  innerRef?: React.RefObject<any>;
  style?: React.CSSProperties;
  onHideMenu?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  zIndex?: number;
}) {
  const MenuRef = useRef(null);
  const { x, y, width, height } = dropdownContext;
  outsideClickMethod(MenuRef, onHideMenu);
  const displaysToTheRight = useMemo(() => {
    return window.innerWidth / 2 - x > 0;
  }, [x]);
  const isReversed = useMemo(() => {
    return window.innerHeight / 2 - y < 0;
  }, [y]);
  const { getColor: getFilterColor } = useRoleColor('filter', {
    fallback: 'logoBlue'
  });
  const highlightBg = useMemo(
    () => getFilterColor(0.14) || Color.highlightGray(),
    [getFilterColor]
  );
  const highlightBorder = useMemo(
    () => getFilterColor(0.32) || Color.borderGray(),
    [getFilterColor]
  );

  return createPortal(
    <ErrorBoundary
      componentPath="DropdownList"
      style={{
        zIndex,
        top: 0,
        position: 'fixed'
      }}
    >
      <div ref={MenuRef}>
        <ul
          ref={innerRef}
          style={style}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={`${css`
            position: absolute;
            left: ${`${
              displaysToTheRight
                ? `${x}px`
                : `CALC(${x + xAdjustment}px + ${width}px)`
            }`};
            top: ${isReversed
              ? `CALC(${y}px - 0.5rem)`
              : `CALC(${y}px + ${height}px + 0.5rem)`};
            z-index: 10;
            padding: 0.6rem;
            margin: 0;
            transform: translate(
              ${displaysToTheRight ? 0 : '-100%'},
              ${isReversed ? '-100%' : 0}
            );
            list-style: none;
            background: #fff;
            border: 1px solid var(--ui-border);
            border-radius: 12px;
            box-shadow: 0 22px 45px -24px rgba(15, 23, 42, 0.32);
            font-weight: 600;
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            min-width: ${Math.max(180, width)}px;
            li {
              width: 100%;
              border-radius: 9px;
              padding: 0.9rem 1.1rem;
              text-align: center;
              font-size: 1.45rem;
              color: ${Color.darkGray()};
              cursor: pointer;
              transition: background 0.15s ease, color 0.15s ease,
                box-shadow 0.15s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 0.75rem;
              &:hover {
                background: ${highlightBg};
                color: ${Color.black()};
                box-shadow: inset 0 0 0 1px ${highlightBorder};
              }
              a {
                text-decoration: none;
                color: inherit;
              }
            }
          `} ${className}`}
        >
          {children}
        </ul>
      </div>
    </ErrorBoundary>,
    document.getElementById('outer-layer') as HTMLElement
  );
}
