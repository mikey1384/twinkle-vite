import React, { useMemo, useRef } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { createPortal } from 'react-dom';
import { useOutsideTap, useOutsideClick } from '~/helpers/hooks';
import { isMobile } from '~/helpers';

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
            padding: 0;
            transform: translate(
              ${displaysToTheRight ? 0 : '-100%'},
              ${isReversed ? '-100%' : 0}
            );
            border: none;
            list-style: none;
            background: #fff;
            box-shadow: 1px 1px 2px ${Color.black(0.6)};
            font-weight: normal;
            line-height: 1.5;
            display: flex;
            flex-direction: column;
            li {
              width: 100%;
              border-radius: 0;
              border: none;
              padding: 1rem;
              text-align: center;
              font-size: 1.5rem;
              color: ${Color.darkerGray()};
              cursor: pointer;
              border-bottom: none;
              &:hover {
                background: ${Color.highlightGray()};
              }
              a {
                text-decoration: none;
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
