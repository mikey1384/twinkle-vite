import React, { RefObject, useEffect, useLayoutEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { createPortal } from 'react-dom';

const DROPDOWN_GAP = 4;
const VIEWPORT_GUTTER = 8;
const MAX_DROPDOWN_HEIGHT = 320;

interface DropdownPosition {
  left: number;
  top?: number;
  bottom?: number;
  width: number;
  maxHeight: number;
  placement: 'top' | 'bottom';
}

function getDropdownPortalTarget() {
  if (typeof document === 'undefined') return null;
  return (
    document.getElementById('outer-layer') ||
    document.getElementById('modal') ||
    document.body
  );
}

export default function SearchDropdown({
  anchorRef,
  innerRef,
  dropdownFooter,
  indexToHighlight,
  searchResults,
  onUpdate,
  style = {},
  onItemClick,
  renderItemLabel,
  renderItemUrl
}: {
  anchorRef?: RefObject<HTMLElement | null>;
  innerRef?: any;
  dropdownFooter?: any;
  indexToHighlight: number;
  searchResults: any[];
  onUpdate: () => void;
  style?: any;
  onItemClick: (item: any) => void;
  renderItemLabel?: (item: any) => any;
  renderItemUrl?: (item: any) => string;
}) {
  const [dropdownPosition, setDropdownPosition] =
    useState<DropdownPosition | null>(null);
  const [anchorTypography, setAnchorTypography] = useState<{
    fontSize: string;
    fontFamily: string;
    fontWeight: string;
    lineHeight: string;
  } | null>(null);

  useEffect(() => {
    onUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults]);

  useLayoutEffect(() => {
    const anchor = anchorRef?.current;
    if (!anchor || typeof window === 'undefined') return;
    const anchorElement: HTMLElement = anchor;

    let frameId = 0;
    function updatePosition() {
      const rect = anchorElement.getBoundingClientRect();
      const anchorStyle = window.getComputedStyle(anchorElement);
      const viewportHeight =
        window.visualViewport?.height ||
        window.innerHeight ||
        document.documentElement.clientHeight;
      const viewportWidth =
        window.visualViewport?.width ||
        window.innerWidth ||
        document.documentElement.clientWidth;
      const availableBelow = Math.max(
        0,
        viewportHeight - rect.bottom - VIEWPORT_GUTTER - DROPDOWN_GAP
      );
      const availableAbove = Math.max(
        0,
        rect.top - VIEWPORT_GUTTER - DROPDOWN_GAP
      );
      const shouldOpenUp =
        availableBelow < MAX_DROPDOWN_HEIGHT &&
        availableAbove > availableBelow;
      const availableHeight = shouldOpenUp ? availableAbove : availableBelow;
      const width = Math.min(rect.width, viewportWidth - VIEWPORT_GUTTER * 2);
      const left = Math.min(
        Math.max(VIEWPORT_GUTTER, rect.left),
        Math.max(VIEWPORT_GUTTER, viewportWidth - width - VIEWPORT_GUTTER)
      );

      setDropdownPosition({
        left,
        width,
        maxHeight: Math.min(MAX_DROPDOWN_HEIGHT, availableHeight),
        placement: shouldOpenUp ? 'top' : 'bottom',
        ...(shouldOpenUp
          ? {
              bottom: viewportHeight - rect.top + DROPDOWN_GAP
            }
          : {
              top: rect.bottom + DROPDOWN_GAP
            })
      });
      setAnchorTypography((prev) => {
        const next = {
          fontSize: anchorStyle.fontSize,
          fontFamily: anchorStyle.fontFamily,
          fontWeight: anchorStyle.fontWeight,
          lineHeight: anchorStyle.lineHeight
        };
        if (
          prev?.fontSize === next.fontSize &&
          prev?.fontFamily === next.fontFamily &&
          prev?.fontWeight === next.fontWeight &&
          prev?.lineHeight === next.lineHeight
        ) {
          return prev;
        }
        return next;
      });
    }

    function queuePositionUpdate() {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updatePosition);
    }

    queuePositionUpdate();
    window.addEventListener('resize', queuePositionUpdate);
    window.addEventListener('scroll', queuePositionUpdate, true);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(queuePositionUpdate);
      resizeObserver.observe(anchorElement);
    }

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', queuePositionUpdate);
      window.removeEventListener('scroll', queuePositionUpdate, true);
      resizeObserver?.disconnect();
    };
  }, [anchorRef, searchResults.length]);

  const portalTarget = anchorRef ? getDropdownPortalTarget() : null;
  const shouldUsePortal = !!portalTarget && !!anchorRef && !!dropdownPosition;

  const dropdown = (
    <ErrorBoundary
      className={css`
        ${shouldUsePortal
          ? ''
          : `
          position: absolute;
          top: calc(100% + 0.4rem);
          left: 0;
          right: 0;
        `}
        background: #fff;
        border: 1px solid var(--ui-border);
        border-radius: 12px;
        box-shadow: none;
        overflow: hidden;
      `}
      componentPath="SearchDropdown"
      style={
        shouldUsePortal
          ? {
              position: 'fixed',
              left: `${dropdownPosition.left}px`,
              ...(dropdownPosition.placement === 'top'
                ? { bottom: `${dropdownPosition.bottom}px` }
                : { top: `${dropdownPosition.top}px` }),
              width: `${dropdownPosition.width}px`,
              maxHeight: `${dropdownPosition.maxHeight}px`,
              zIndex: 100_000_000,
              fontSize: anchorTypography?.fontSize,
              fontFamily: anchorTypography?.fontFamily,
              fontWeight: anchorTypography?.fontWeight,
              lineHeight: anchorTypography?.lineHeight,
              ...style
            }
          : style
      }
    >
      <div
        ref={innerRef}
        className={css`
          width: 100%;
          display: block;
          max-height: inherit;
          overflow-y: auto;
          overscroll-behavior: contain;
          nav {
            padding: 1rem 1.2rem;
            color: ${Color.darkerGray()};
            cursor: pointer;
          }
          @media (hover: hover) and (pointer: fine) {
            nav:hover {
              background: ${Color.highlightGray()};
            }
          }
          nav a {
            text-decoration: none;
            color: ${Color.darkerGray()};
          }
      `}
    >
        {searchResults.map((item, index) => {
          const itemStyle =
            index === indexToHighlight
              ? { background: Color.highlightGray() }
              : {};
          const href = renderItemUrl ? { href: renderItemUrl(item) } : {};
          return (
            <nav
              key={index}
              style={{
                width: '100%',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                ...itemStyle
              }}
              onClick={() => onItemClick(item)}
            >
              <a
                {...href}
                style={{
                  lineHeight: 'normal'
                }}
                onClick={(e) => e.preventDefault()}
              >
                {renderItemLabel?.(item)}
              </a>
            </nav>
          );
        })}
        {dropdownFooter && (
          <div style={{ padding: '1rem' }}>{dropdownFooter}</div>
        )}
      </div>
    </ErrorBoundary>
  );

  return shouldUsePortal ? createPortal(dropdown, portalTarget) : dropdown;
}
