import React, { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { createPortal } from 'react-dom';

const DROPDOWN_GAP = 4;
const VIEWPORT_GUTTER = 8;
const MAX_DROPDOWN_HEIGHT = 320;
const DROPDOWN_BORDER_WIDTH = 1;

interface DropdownPosition {
  left: number;
  top: number;
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

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
      // All values below are client (layout viewport) coordinates — the same
      // space position: fixed resolves against. The visual viewport (which
      // shrinks/pans for the mobile keyboard and pinch zoom) is only used to
      // compute the visible region; its dimensions must never be used directly
      // as fixed-position offsets.
      const rect = anchorElement.getBoundingClientRect();
      const anchorStyle = window.getComputedStyle(anchorElement);
      const visualViewport = window.visualViewport;
      const visibleTop = visualViewport?.offsetTop || 0;
      const visibleLeft = visualViewport?.offsetLeft || 0;
      const visibleHeight =
        visualViewport?.height ||
        window.innerHeight ||
        document.documentElement.clientHeight;
      const visibleWidth =
        visualViewport?.width ||
        window.innerWidth ||
        document.documentElement.clientWidth;
      const visibleBottom = visibleTop + visibleHeight;
      const availableBelow = Math.max(
        0,
        visibleBottom - rect.bottom - VIEWPORT_GUTTER - DROPDOWN_GAP
      );
      const availableAbove = Math.max(
        0,
        rect.top - visibleTop - VIEWPORT_GUTTER - DROPDOWN_GAP
      );
      const width = Math.min(rect.width, visibleWidth - VIEWPORT_GUTTER * 2);
      const left = Math.min(
        Math.max(visibleLeft + VIEWPORT_GUTTER, rect.left),
        Math.max(
          visibleLeft + VIEWPORT_GUTTER,
          visibleLeft + visibleWidth - width - VIEWPORT_GUTTER
        )
      );

      let contentHeight = MAX_DROPDOWN_HEIGHT;
      if (containerRef.current && contentRef.current) {
        // Apply the final width before measuring so wrapping is accounted for.
        containerRef.current.style.width = `${width}px`;
        contentHeight =
          contentRef.current.scrollHeight + DROPDOWN_BORDER_WIDTH * 2;
      }
      const neededHeight = Math.min(contentHeight, MAX_DROPDOWN_HEIGHT);
      const shouldOpenUp =
        availableBelow < neededHeight && availableAbove > availableBelow;
      const availableHeight = shouldOpenUp ? availableAbove : availableBelow;

      setDropdownPosition({
        left,
        width,
        maxHeight: Math.min(MAX_DROPDOWN_HEIGHT, availableHeight),
        placement: shouldOpenUp ? 'top' : 'bottom',
        top: shouldOpenUp ? rect.top - DROPDOWN_GAP : rect.bottom + DROPDOWN_GAP
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
    // Keyboard show/hide and visual-viewport pans fire these, not window
    // resize/scroll, on iOS/Android.
    window.visualViewport?.addEventListener('resize', queuePositionUpdate);
    window.visualViewport?.addEventListener('scroll', queuePositionUpdate);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(queuePositionUpdate);
      resizeObserver.observe(anchorElement);
      if (contentRef.current) {
        resizeObserver.observe(contentRef.current);
      }
    }

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', queuePositionUpdate);
      window.removeEventListener('scroll', queuePositionUpdate, true);
      window.visualViewport?.removeEventListener('resize', queuePositionUpdate);
      window.visualViewport?.removeEventListener('scroll', queuePositionUpdate);
      resizeObserver?.disconnect();
    };
  }, [anchorRef, searchResults.length]);

  const portalTarget = anchorRef ? getDropdownPortalTarget() : null;
  const shouldUsePortal = !!portalTarget && !!anchorRef;

  const dropdown = (
    <ErrorBoundary
      innerRef={containerRef}
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
        border: ${DROPDOWN_BORDER_WIDTH}px solid var(--ui-border);
        border-radius: 12px;
        box-shadow: none;
        overflow: hidden;
      `}
      componentPath="SearchDropdown"
      style={
        shouldUsePortal
          ? {
              position: 'fixed',
              ...(dropdownPosition
                ? {
                    left: `${dropdownPosition.left}px`,
                    top: `${dropdownPosition.top}px`,
                    // translateY pins the dropdown's bottom edge to `top` when
                    // opening upward, so no CSS `bottom` (which resolves
                    // against the layout viewport and misplaces the dropdown
                    // when the mobile keyboard shrinks the visual viewport)
                    // is ever needed.
                    ...(dropdownPosition.placement === 'top'
                      ? { transform: 'translateY(-100%)' }
                      : {}),
                    width: `${dropdownPosition.width}px`,
                    maxHeight: `${dropdownPosition.maxHeight}px`
                  }
                : {
                    left: 0,
                    top: 0,
                    maxHeight: `${MAX_DROPDOWN_HEIGHT}px`,
                    visibility: 'hidden'
                  }),
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
        ref={(node: HTMLDivElement | null) => {
          contentRef.current = node;
          if (typeof innerRef === 'function') {
            innerRef(node);
          } else if (innerRef) {
            innerRef.current = node;
          }
        }}
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
