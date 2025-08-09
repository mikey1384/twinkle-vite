import React, { useEffect } from 'react';
import { css } from '@emotion/css';
import { Color, tabletMaxWidth } from '~/constants/css';
import { createPortal } from 'react-dom';

interface Item {
  label: string;
  value: number;
  disabled?: boolean;
}

export default function LevelDropdown({
  items,
  selectedLabel,
  onSelect,
  disabled
}: {
  items: Item[];
  selectedLabel: string;
  onSelect: (value: number) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [anchorRect, setAnchorRect] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLUListElement | null>(null);
  const didInitialScrollRef = React.useRef<boolean>(false);

  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (!open) return;
      const target = e.target as Node;
      if (btnRef.current && btnRef.current.contains(target)) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleResize() {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setAnchorRect({ x: r.x, y: r.y, width: r.width, height: r.height });
    }
    handleResize();
    const onScroll = (e: Event) => {
      const target = e.target as Node | null;
      if (target && menuRef.current && menuRef.current.contains(target)) return;
      handleResize();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const buttonCls = css`
    cursor: ${disabled ? 'not-allowed' : 'pointer'};
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    color: #374151;
    font-weight: 700;
    font-size: 1.05rem;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    text-align: center;
    width: 100%;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    opacity: ${disabled ? 0.6 : 1};
    transition: all 0.15s ease;
    &:hover {
      background: ${disabled ? '#f8fafc' : '#f1f5f9'};
      border-color: ${disabled ? '#e2e8f0' : '#3b82f6'};
    }
    @media (max-width: ${tabletMaxWidth}) {
      font-size: 1.1rem;
      padding: 0.7rem 1rem;
    }
  `;

  const menu =
    open && anchorRect
      ? createPortal(
          (() => {
            const viewportH = window.innerHeight || 800;
            const viewportW = window.innerWidth || 1200;
            const spaceBelow = Math.max(
              0,
              viewportH - (anchorRect!.y + anchorRect!.height) - 8
            );
            const spaceAbove = Math.max(0, anchorRect!.y - 8);
            const cap = viewportH * (viewportW <= 768 ? 0.7 : 0.6);
            const placeBelow = spaceBelow >= spaceAbove;
            const maxHeight = Math.max(
              160,
              Math.min(cap, placeBelow ? spaceBelow : spaceAbove)
            );
            const minWidth = Math.max(anchorRect!.width, 240);
            const maxWidth = Math.min(viewportW * 0.92, 420);
            const width = Math.min(Math.max(minWidth, 0), maxWidth);
            const left = Math.max(
              8,
              Math.min(anchorRect!.x, viewportW - width - 8)
            );
            const top = placeBelow
              ? anchorRect!.y + anchorRect!.height + 8
              : anchorRect!.y - 8; // translateY(-100%) when above
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
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              boxShadow: '0 10px 24px rgba(0,0,0,0.15)',
              padding: '0.25rem 0',
              margin: 0,
              listStyle: 'none',
              zIndex: 1000000000,
              overscrollBehavior: 'contain',
              pointerEvents: 'auto',
              transform: placeBelow ? undefined : 'translateY(-100%)'
            } as React.CSSProperties;
            return (
              <ul
                ref={(el) => {
                  if (el) {
                    menuRef.current = el;
                    if (!didInitialScrollRef.current) {
                      // Scroll currently selected into view when opening
                      try {
                        const idx = items.findIndex(
                          (i) => i.label === selectedLabel
                        );
                        if (idx >= 0) {
                          const li = el.children[idx] as
                            | HTMLElement
                            | undefined;
                          if (li) {
                            const top =
                              li.offsetTop -
                              el.clientHeight / 2 +
                              li.clientHeight / 2;
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
                      &:hover {
                        background: ${item.disabled
                          ? '#fff'
                          : Color.highlightGray()};
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
                      setOpen(false);
                    }}
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            );
          })(),
          document.getElementById('outer-layer') as HTMLElement
        )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        className={buttonCls}
        onClick={(e) => {
          if (disabled) return;
          e.preventDefault();
          e.stopPropagation();
          const r = btnRef.current!.getBoundingClientRect();
          setAnchorRect({ x: r.x, y: r.y, width: r.width, height: r.height });
          // Reset initial scroll flag when opening so we center current level again
          if (!open) {
            didInitialScrollRef.current = false;
            setOpen(true);
          } else {
            setOpen(false);
          }
        }}
      >
        <span>{selectedLabel}</span>
        <span
          className={css`
            opacity: 0.7;
          `}
        >
          ▼
        </span>
      </button>
      {menu}
    </>
  );
}
