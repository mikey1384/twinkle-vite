import React, { RefObject } from 'react';
import { createPortal } from 'react-dom';
import { css } from '@emotion/css';
import { Color, tabletMaxWidth } from '~/constants/css';
import { Item } from '.';

export default function DropdownMenu({
  open,
  anchorRect,
  items,
  selectedLabel,
  menuRef,
  didInitialScrollRef,
  onSelect
}: {
  open: boolean;
  anchorRect: { x: number; y: number; width: number; height: number } | null;
  items: Item[];
  selectedLabel: string;
  menuRef: RefObject<HTMLUListElement | null>;
  didInitialScrollRef: RefObject<boolean>;
  onSelect: (value: number) => void;
}) {
  if (!open || !anchorRect) return null;

  const viewportH = window.innerHeight || 800;
  const viewportW = window.innerWidth || 1200;
  const spaceBelow = Math.max(
    0,
    viewportH - (anchorRect.y + anchorRect.height) - 8
  );
  const spaceAbove = Math.max(0, anchorRect.y - 8);
  const cap = viewportH * (viewportW <= 768 ? 0.7 : 0.6);
  const placeBelow = spaceBelow >= spaceAbove;
  const maxHeight = Math.max(
    160,
    Math.min(cap, placeBelow ? spaceBelow : spaceAbove)
  );
  const minWidth = Math.max(anchorRect.width, 240);
  const maxWidth = Math.min(viewportW * 0.92, 420);
  const width = Math.min(Math.max(minWidth, 0), maxWidth);
  const left = Math.max(8, Math.min(anchorRect.x, viewportW - width - 8));
  const top = placeBelow
    ? anchorRect.y + anchorRect.height + 8
    : anchorRect.y - 8;

  const style: React.CSSProperties = {
    position: 'fixed',
    left,
    top,
    minWidth,
    maxWidth,
    maxHeight,
    overflowY: 'scroll',
    WebkitOverflowScrolling: 'touch',
    background: '#ffffff',
    border: '1px solid var(--ui-border)',
    borderRadius: 10,
    boxShadow: '0 10px 24px rgba(0,0,0,0.15)',
    padding: '0.25rem 0',
    margin: 0,
    listStyle: 'none',
    zIndex: 1000000000,
    overscrollBehavior: 'contain',
    pointerEvents: 'auto',
    transform: placeBelow ? undefined : 'translateY(-100%)'
  };

  return createPortal(
    <ul
      ref={(el) => {
        if (el) {
          menuRef.current = el;
          if (!didInitialScrollRef.current) {
            try {
              const idx = items.findIndex((i) => i.label === selectedLabel);
              if (idx >= 0) {
                const li = el.children[idx] as HTMLElement | undefined;
                if (li) {
                  const top =
                    li.offsetTop - el.clientHeight / 2 + li.clientHeight / 2;
                  el.scrollTop = Math.max(
                    0,
                    Math.min(top, el.scrollHeight - el.clientHeight)
                  );
                }
              }
            } catch {}
            didInitialScrollRef.current = true;
          }
        }
      }}
      style={style}
      className={css``}
    >
      {items.map((item) => (
        <li
          key={item.value}
          className={css`
            padding: 0.9rem 1rem;
            font-size: 1.1rem;
            font-weight: 700;
            color: ${Color.darkerGray()};
            cursor: ${item.disabled ? 'default' : 'pointer'};
            opacity: ${item.disabled ? 0.5 : 1};
            @media (hover: hover) and (pointer: fine) {
              &:hover {
                background: ${item.disabled ? '#fff' : Color.highlightGray()};
              }
            }
            @media (max-width: ${tabletMaxWidth}) {
              font-size: 1.2rem;
            }
          `}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (item.disabled) return;
            onSelect(item.value);
          }}
        >
          {item.label}
        </li>
      ))}
    </ul>,
    document.getElementById('outer-layer') as HTMLElement
  );
}
