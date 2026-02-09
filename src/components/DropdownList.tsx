import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { createPortal } from 'react-dom';
import { useOutsideClick } from '~/helpers/hooks';
import { isMobile } from '~/helpers';
import { useRoleColor } from '~/theme/useRoleColor';

const deviceIsMobile = isMobile(navigator);

function getDropdownPortalTarget() {
  if (typeof document === 'undefined') return null;
  return (
    document.getElementById('outer-layer') ||
    document.getElementById('modal') ||
    document.body
  );
}

function detachPortalContainer(container: HTMLElement) {
  const parent = container.parentNode;
  if (parent && parent.contains(container)) {
    parent.removeChild(container);
  }
}

function attachPortalContainer(container: HTMLElement, target: HTMLElement) {
  if (container.parentNode === target) return;
  detachPortalContainer(container);
  target.appendChild(container);
}

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
  const [portalContainer] = useState<HTMLElement | null>(() => {
    if (typeof document === 'undefined') return null;
    const element = document.createElement('div');
    element.setAttribute('data-dropdown-portal', 'true');
    element.setAttribute('translate', 'no');
    element.className = 'notranslate';
    return element;
  });
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const { x, y, width, height } = dropdownContext;
  useOutsideClick(MenuRef, onHideMenu, { closeOnScroll: deviceIsMobile });
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

  useLayoutEffect(() => {
    if (!portalContainer || typeof document === 'undefined') return;

    const target = getDropdownPortalTarget();
    if (!target) return;

    attachPortalContainer(portalContainer, target);
    setPortalRoot(target);

    const observer = new MutationObserver(() => {
      const currentTarget = getDropdownPortalTarget();
      if (!currentTarget) return;
      if (portalContainer.parentNode !== currentTarget) {
        attachPortalContainer(portalContainer, currentTarget);
        setPortalRoot(currentTarget);
      }
    });

    observer.observe(document.body, { childList: true });

    return () => {
      observer.disconnect();
      setPortalRoot(null);
      detachPortalContainer(portalContainer);
    };
  }, [portalContainer]);

  const dropdownContent = (
    <ErrorBoundary
      componentPath="DropdownList"
      style={{
        zIndex,
        top: 0,
        position: 'fixed'
      }}
    >
      <div ref={MenuRef} className="notranslate" translate="no">
        <ul
          ref={innerRef}
          translate="no"
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
              @media (hover: hover) and (pointer: fine) {
                &:hover {
                  background: ${highlightBg};
                  color: ${Color.black()};
                  box-shadow: inset 0 0 0 1px ${highlightBorder};
                }
              }
              a {
                text-decoration: none;
                color: inherit;
              }
            }
          `} ${className || ''} notranslate`}
        >
          {children}
        </ul>
      </div>
    </ErrorBoundary>
  );

  return portalRoot && portalContainer
    ? createPortal(dropdownContent, portalContainer)
    : dropdownContent;
}
