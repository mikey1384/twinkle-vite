import React, { RefObject, useEffect, useLayoutEffect, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { createPortal } from 'react-dom';

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
  const [anchorRect, setAnchorRect] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
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
      setAnchorRect({
        left: rect.left,
        top: rect.bottom + 4,
        width: rect.width
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
  const shouldUsePortal = !!portalTarget && !!anchorRef && !!anchorRect;

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
              left: `${anchorRect.left}px`,
              top: `${anchorRect.top}px`,
              width: `${anchorRect.width}px`,
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
