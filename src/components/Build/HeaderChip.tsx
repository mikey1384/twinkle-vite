import React, { useEffect, useId, useRef, useState } from 'react';
import { css } from '@emotion/css';
import DropdownList from '~/components/DropdownList';
import Icon from '~/components/Icon';
import { BUILD_WORKSPACE_COMPACT_MEDIA_QUERY } from '~/containers/Build/Editor/constants';

// The Build page header's one chip language: the PUBLIC / LIVE status pills
// and the strip under the title (address, XP & Coins, Players) share this
// shape, type and set of tones, and every header menu (Settings, the
// address) is the same DropdownList.

export type HeaderChipTone =
  | 'blue'
  | 'slate'
  | 'green'
  | 'pink'
  | 'amber'
  | 'violet';

export const HEADER_CHIP_TONES: Record<HeaderChipTone, React.CSSProperties> = {
  blue: {
    background: 'rgba(65, 140, 235, 0.14)',
    borderColor: 'rgba(65, 140, 235, 0.34)',
    color: '#1d4ed8'
  },
  slate: {
    background: 'rgba(100, 116, 139, 0.14)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
    color: '#334155'
  },
  green: {
    background: 'rgba(34, 197, 94, 0.14)',
    borderColor: 'rgba(34, 197, 94, 0.34)',
    color: '#15803d'
  },
  pink: {
    background: 'rgba(236, 72, 153, 0.13)',
    borderColor: 'rgba(236, 72, 153, 0.32)',
    color: '#be185d'
  },
  amber: {
    background: 'rgba(245, 158, 11, 0.16)',
    borderColor: 'rgba(245, 158, 11, 0.38)',
    color: '#b45309'
  },
  violet: {
    background: 'rgba(139, 92, 246, 0.14)',
    borderColor: 'rgba(139, 92, 246, 0.34)',
    color: '#6d28d9'
  }
};

export const headerChipFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

export const headerChipClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 1.1rem;
  padding: 0.58rem 0.9rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 900;
  font-family: ${headerChipFontFamily};
  border: 2px solid transparent;
  line-height: 1;
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.12);
  text-decoration: none;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
  &[href],
  &:is(button) {
    cursor: pointer;
  }
  &[href]:hover,
  &:is(button):hover {
    transform: translateY(-1px);
    text-decoration: none;
    box-shadow: 0 3px 0 rgba(15, 23, 42, 0.14);
  }
  &[href]:focus-visible,
  &:is(button):focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
    text-decoration: none;
  }
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    flex: 0 0 auto;
    gap: 0.3rem;
    padding: 0.3rem 0.55rem;
    border-width: 1px;
    box-shadow: none;
    font-size: 1rem;
  }
`;

// The strip's chips say a name or an address, so they keep their letter
// case; everything else is the status pill above.
const stripChipClass = css`
  position: relative;
  max-width: 100%;
  min-width: 0;
  text-transform: none;
  letter-spacing: 0.01em;
  font-size: 1.2rem;
  white-space: nowrap;
  > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  > svg {
    flex: 0 0 auto;
  }
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    flex: 0 0 auto;
    max-width: 22rem;
    gap: 0.4rem;
    padding: 0.45rem 0.75rem;
    font-size: 1.15rem;
  }
  /* Touch: the pill stays the header's size and its tap area reaches 40px
     (the strip's row gap leaves room for it). */
  @media (pointer: coarse) {
    min-height: 3rem;
    padding: 0 0.95rem;
    &::before {
      content: '';
      position: absolute;
      inset: -0.75rem -0.35rem;
    }
  }
`;

const caretClass = css`
  opacity: 0.7;
  font-size: 0.9em;
`;

// The row of chips under the title. It wraps on wide screens; on a phone it
// is one line that scrolls sideways (like the action row above it), padded
// so the chips' touch reach isn't clipped by the scroller.
export const headerChipStripClass = css`
  grid-column: 1 / -1;
  flex: 0 0 100%;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem;
  margin-top: -0.6rem;
  &:empty {
    display: none;
  }
  @media (pointer: coarse) {
    gap: 1.2rem 0.55rem;
  }
  @media ${BUILD_WORKSPACE_COMPACT_MEDIA_QUERY} {
    flex-wrap: nowrap;
    gap: 0.5rem;
    width: auto;
    margin: -0.7rem -0.75rem;
    padding: 0.7rem 0.75rem;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    > * {
      flex: 0 0 auto;
    }
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

export interface HeaderMenuTriggerProps {
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  'aria-controls'?: string;
}

export function HeaderChip({
  chip,
  icon,
  tone,
  label,
  title,
  caret = false,
  menuTrigger,
  onClick
}: {
  // names the chip for tests and screenshots (data-header-chip)
  chip: string;
  icon: string;
  tone: HeaderChipTone;
  label: React.ReactNode;
  title?: string;
  caret?: boolean;
  // set when the chip opens a HeaderMenu
  menuTrigger?: HeaderMenuTriggerProps;
  onClick?: () => void;
}) {
  const content = (
    <>
      <Icon icon={icon} />
      <span>{label}</span>
      {caret ? <Icon className={caretClass} icon="chevron-down" /> : null}
    </>
  );
  if (!onClick) {
    return (
      <span
        className={`${headerChipClass} ${stripChipClass}`}
        style={HEADER_CHIP_TONES[tone]}
        title={title}
        data-header-chip={chip}
      >
        {content}
      </span>
    );
  }
  return (
    <button
      type="button"
      className={`${headerChipClass} ${stripChipClass}`}
      style={HEADER_CHIP_TONES[tone]}
      title={title}
      data-header-chip={chip}
      {...menuTrigger}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

export interface HeaderMenuItem {
  label?: React.ReactNode;
  onClick?: () => void;
  // a link (opens in a new tab); the row is a real <a>
  href?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  separator?: boolean;
  // the menu stays open after this item (Copy shows "Copied!" in place)
  keepOpen?: boolean;
}

const MENU_ITEM_SELECTOR = '[role="menuitem"]:not([aria-disabled="true"])';

// A header trigger with its DropdownList menu (Settings, the address chip).
// Keyboard: Enter, Space or ArrowDown on the trigger opens it with focus on
// the first row; ArrowUp/ArrowDown/Home/End move; Enter or Space picks;
// Escape or Tab closes and returns focus to the trigger.
export function HeaderMenu({
  items,
  renderTrigger,
  menuStyle,
  label
}: {
  items: HeaderMenuItem[];
  renderTrigger: (props: {
    open: boolean;
    onToggle: () => void;
    triggerProps: HeaderMenuTriggerProps;
  }) => React.ReactNode;
  menuStyle?: React.CSSProperties;
  // the menu's accessible name
  label: string;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const keyboardOpenRef = useRef(false);
  const menuId = useId();
  const [dropdownContext, setDropdownContext] = useState<DOMRect | null>(null);
  const open = !!dropdownContext;

  useEffect(() => {
    if (!open || !keyboardOpenRef.current) return;
    keyboardOpenRef.current = false;
    const frame = window.requestAnimationFrame(() => focusItem('first'));
    return () => window.cancelAnimationFrame(frame);
    // focusItem reads the rendered menu by id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape also closes a menu opened by pointer while focus is elsewhere.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setDropdownContext(null);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div
      ref={triggerRef}
      className={menuTriggerClass}
      onKeyDown={handleKeyDown}
    >
      {renderTrigger({
        open,
        onToggle: handleToggle,
        triggerProps: {
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          'aria-controls': open ? menuId : undefined
        }
      })}
      {dropdownContext ? (
        <DropdownList
          dropdownContext={dropdownContext}
          triggerRef={triggerRef}
          onHideMenu={handleHide}
          className={menuListClass}
          fitToViewport
          listProps={{ id: menuId, role: 'menu', 'aria-label': label }}
          style={{ minWidth: '15rem', width: 'max-content', ...menuStyle }}
        >
          {items.map((item, index) => {
            if (item.separator) return <hr key={index} role="separator" />;
            const inert = item.disabled || (!item.onClick && !item.href);
            const rowClass = css`
              opacity: ${item.disabled ? 0.3 : 1};
              cursor: ${inert ? 'default' : 'pointer'};
              @media (hover: hover) and (pointer: fine) {
                &:hover {
                  background: ${inert ? '#fff !important' : ''};
                  box-shadow: ${inert ? 'none !important' : ''};
                }
              }
            `;
            if (item.href && !item.disabled) {
              return (
                <li key={index} role="none" className={`${rowClass} ${linkRowClass}`}>
                  <a
                    role="menuitem"
                    tabIndex={-1}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={item.style}
                    onClick={() => handleActivate(item)}
                  >
                    {item.label}
                  </a>
                </li>
              );
            }
            return (
              <li
                key={index}
                role="menuitem"
                tabIndex={inert ? undefined : -1}
                aria-disabled={inert || undefined}
                style={item.style}
                className={rowClass}
                onClick={inert ? undefined : () => handleActivate(item)}
              >
                {item.label}
              </li>
            );
          })}
        </DropdownList>
      ) : null}
    </div>
  );

  function handleActivate(item: HeaderMenuItem) {
    if (!item.keepOpen) closeAndFocusTrigger();
    item.onClick?.();
  }

  function menuElement() {
    return document.getElementById(menuId);
  }

  function triggerButton() {
    return triggerRef.current?.querySelector<HTMLElement>('button') || null;
  }

  function focusItem(which: 'first' | 'last' | 'next' | 'prev') {
    const rows = Array.from(
      menuElement()?.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR) || []
    );
    if (!rows.length) return;
    const current = rows.indexOf(document.activeElement as HTMLElement);
    const index =
      which === 'first'
        ? 0
        : which === 'last'
          ? rows.length - 1
          : which === 'next'
            ? current < 0
              ? 0
              : (current + 1) % rows.length
            : current < 0
              ? rows.length - 1
              : (current - 1 + rows.length) % rows.length;
    rows[index].focus();
  }

  function closeAndFocusTrigger() {
    setDropdownContext(null);
    triggerButton()?.focus({ preventScroll: true });
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    const inMenu = Boolean(
      menuElement()?.contains(event.target as Node)
    );
    if (!open) {
      if (event.key === 'Enter' || event.key === ' ') {
        // the button's click follows and opens the menu
        keyboardOpenRef.current = true;
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        keyboardOpenRef.current = true;
        handleToggle();
      }
      return;
    }
    switch (event.key) {
      case 'Escape':
      case 'Tab':
        event.preventDefault();
        event.stopPropagation();
        closeAndFocusTrigger();
        return;
      case 'ArrowDown':
        event.preventDefault();
        focusItem('next');
        return;
      case 'ArrowUp':
        event.preventDefault();
        focusItem('prev');
        return;
      case 'Home':
        event.preventDefault();
        focusItem('first');
        return;
      case 'End':
        event.preventDefault();
        focusItem('last');
        return;
      case 'Enter':
      case ' ': {
        if (!inMenu) return;
        const row = event.target as HTMLElement;
        if (row.getAttribute('role') !== 'menuitem') return;
        // a link follows itself on Enter; Space and plain rows click
        if (row.tagName === 'A' && event.key === 'Enter') return;
        event.preventDefault();
        row.click();
        return;
      }
    }
  }

  function handleToggle() {
    setDropdownContext(
      dropdownContext
        ? null
        : (triggerRef.current?.getBoundingClientRect() ?? null)
    );
  }

  function handleHide() {
    keyboardOpenRef.current = false;
    setDropdownContext(null);
  }
}

// A link row: the anchor fills the row so the whole row is the link.
const linkRowClass = css`
  && {
    padding: 0;
  }
  && > a {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 0.9rem 1.1rem;
    border-radius: inherit;
  }
  && > a > svg:first-child {
    flex: 0 0 1.25em;
    width: 1.25em;
  }
  && > a > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

// Menu rows read left to right, one line each, with their icons in one
// column; a long address shortens with an ellipsis.
const menuListClass = css`
  max-width: calc(100vw - 2rem);
  && li {
    justify-content: flex-start;
    text-align: left;
    white-space: nowrap;
  }
  && li > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  && li > svg:first-child {
    flex: 0 0 1.25em;
    width: 1.25em;
  }
  && > hr,
  && > li {
    flex: none;
  }
  && [role='menuitem']:focus {
    outline: none;
  }
  && [role='menuitem']:focus-visible {
    outline: 2px solid #418ceb;
    outline-offset: -2px;
  }
`;

const menuTriggerClass = css`
  position: relative;
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
`;
