import React, { useEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { createPortal } from 'react-dom';
import { useOutsideClick } from '~/helpers/hooks';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

export default function Popup({
  children,
  popupContext,
  style = {},
  onHideMenu = () => null,
  onMouseEnter = () => null,
  onMouseLeave = () => null
}: {
  children: React.ReactNode;
  popupContext: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: React.CSSProperties;
  onHideMenu?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const MenuRef = useRef(null);
  const { x, y, width, height } = popupContext;
  useOutsideClick(MenuRef, onHideMenu, { closeOnScroll: deviceIsMobile });
  const [portalContainer] = useState(() => {
    if (typeof document === 'undefined') return null;
    const el = document.createElement('div');
    el.setAttribute('data-portal', 'user-popup');
    el.setAttribute('translate', 'no');
    el.className = 'notranslate';
    return el;
  });
  useEffect(() => {
    if (!portalContainer || typeof document === 'undefined') return;
    const target = document.getElementById('outer-layer');
    if (!target) return;
    target.appendChild(portalContainer);
    return () => {
      if (portalContainer.parentNode === target) {
        target.removeChild(portalContainer);
      }
    };
  }, [portalContainer]);
  const displaysToTheRight = useMemo(() => {
    return window.innerWidth / 2 - x > 0;
  }, [x]);
  const isReversed = useMemo(() => {
    return window.innerHeight / 2 - y < 0;
  }, [y]);

  if (!portalContainer) return null;

  return createPortal(
    <ErrorBoundary
      componentPath="UsernameText/UserPopup/Popup"
      style={{
        zIndex: 100_000_000,
        top: 0,
        position: 'fixed'
      }}
    >
      <div ref={MenuRef}>
        <div
          style={style}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={css`
            position: absolute;
            left: ${`${
              displaysToTheRight ? `${x}px` : `CALC(${x}px + ${width}px)`
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
          `}
        >
          {children}
        </div>
      </div>
    </ErrorBoundary>,
    portalContainer
  );
}
