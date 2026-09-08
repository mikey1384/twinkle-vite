import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { isMobile } from '~/helpers';
import { useOutsideClick } from '~/helpers/hooks';
import { messageControlClass } from './messageControlStyles';
import {
  getReactionPickerBounds as getPopoverBounds,
  positionReactionPicker as positionPopover
} from './reactionPickerLayout';

export interface ChatActionItem {
  id: string;
  label: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'danger';
  accent?: string;
}

const deviceIsMobile = isMobile(navigator);

export default function ActionMenu({
  items,
  label = 'Message actions',
  onShownChange,
  dismissWhen = false,
  className = 'menu-button'
}: {
  items: ChatActionItem[];
  label?: string;
  onShownChange?: (shown: boolean) => void;
  dismissWhen?: boolean;
  className?: string;
}) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const focusOnOpen = useRef<'first' | 'last' | null>(null);
  const notifyRef = useRef(onShownChange);
  const [shown, setShown] = useState(false);
  const [position, setPosition] = useState<ReturnType<typeof positionPopover>>();
  notifyRef.current = onShownChange;

  useOutsideClick(rootRef, () => setShown(false), {
    enabled: shown,
    closeOnScroll: false
  });

  useEffect(() => {
    onShownChange?.(shown);
  }, [onShownChange, shown]);

  useEffect(() => () => notifyRef.current?.(false), []);

  useEffect(() => {
    if (dismissWhen) setShown(false);
  }, [dismissWhen]);

  useLayoutEffect(() => {
    if (!shown) return;
    function positionOptions() {
      const root = rootRef.current;
      const options = optionsRef.current;
      if (!root || !options) return;
      setPosition(
        positionPopover(root.getBoundingClientRect(), getPopoverBounds(root), {
          width: options.offsetWidth,
          height: options.scrollHeight + 2 + 6
        })
      );
    }
    positionOptions();
    if (focusOnOpen.current) {
      const options = getEnabledOptions();
      const option = focusOnOpen.current === 'last' ? options.at(-1) : options[0];
      option?.focus({ preventScroll: true });
      focusOnOpen.current = null;
    }
    function handleScroll(event: Event) {
      const root = rootRef.current;
      if (!root || optionsRef.current?.contains(event.target as Node)) return;
      // Focusing an off-screen trigger/option can scroll the chat itself.
      // Refit that focused menu instead of immediately dismissing it.
      if (root.contains(root.ownerDocument.activeElement)) positionOptions();
      else setShown(false);
    }
    window.addEventListener('resize', positionOptions);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('resize', positionOptions);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [shown, items.length]);

  return (
    <div
      ref={rootRef}
      style={{ position: 'relative', display: 'inline-flex' }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setShown(false);
      }}
      onKeyDown={handleKeyDown}
    >
      <Button
        buttonRef={triggerRef}
        aria-label={label}
        aria-expanded={shown}
        aria-controls={id}
        className={`${className} ${messageControlClass}`}
        color="darkerGray"
        variant="solid"
        tone="raised"
        onClick={(event) => {
          event?.stopPropagation();
          setShown((current) => !current);
        }}
      >
        <Icon icon={deviceIsMobile ? 'chevron-down' : 'ellipsis-h'} />
      </Button>
      {shown && (
        <div
          className={popoverClass}
          style={{
            top: position?.top ?? '100%',
            left: position?.left,
            right: position ? undefined : 0,
            paddingTop: position?.above ? 0 : 6,
            paddingBottom: position?.above ? 6 : 0
          }}
        >
          <div
            ref={optionsRef}
            id={id}
            role="group"
            aria-label={`${label} options`}
            className={optionsClass}
            style={{ maxHeight: position?.maxHeight }}
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={item.disabled}
                data-tone={item.tone}
                className={optionClass}
                style={
                  item.accent
                    ? ({ '--chat-action-accent': item.accent } as React.CSSProperties)
                    : undefined
                }
                onClick={(event) => {
                  event.stopPropagation();
                  if (item.disabled) return;
                  // Restore first so Reply/Edit/dialog callbacks can move focus
                  // to their destination without this popup stealing it back.
                  closeAndRestoreFocus();
                  item.onClick();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  function getEnabledOptions() {
    return Array.from(
      optionsRef.current?.querySelectorAll<HTMLButtonElement>(
        'button:not(:disabled)'
      ) || []
    );
  }

  function closeAndRestoreFocus() {
    setShown(false);
    triggerRef.current?.focus({ preventScroll: true });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && shown) {
      event.preventDefault();
      event.stopPropagation();
      closeAndRestoreFocus();
      return;
    }
    const direction =
      event.key === 'ArrowDown'
        ? 'first'
        : event.key === 'ArrowUp'
        ? 'last'
        : null;
    if (!shown) {
      if (direction) {
        event.preventDefault();
        event.stopPropagation();
        focusOnOpen.current = direction;
        setShown(true);
      }
      return;
    }
    if (!direction && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    event.stopPropagation();
    const options = getEnabledOptions();
    const index = options.findIndex((option) => option === document.activeElement);
    if (!options.length) return;
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
        ? options.length - 1
        : direction === 'first'
        ? (index + 1) % options.length
        : index < 0
        ? options.length - 1
        : (index - 1 + options.length) % options.length;
    options[nextIndex]?.focus();
  }
}

const popoverClass = css`
  position: absolute;
  z-index: 5000;
`;

const optionsClass = css`
  display: flex;
  flex-direction: column;
  width: 192px;
  max-width: calc(100vw - 16px);
  padding: 6px;
  gap: 4px;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid #dce3ed;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
`;

const optionClass = css`
  appearance: none;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #253247;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
  svg {
    width: 18px;
    font-size: 16px;
    flex-shrink: 0;
    color: var(--chat-action-accent, currentColor);
  }
  &[data-tone='danger'] {
    color: #b42318;
  }
  &:hover:not(:disabled) {
    background: #eef2f7;
  }
  &:focus-visible {
    outline: 2px solid #334155;
    outline-offset: -2px;
    background: #eef2f7;
  }
  &:disabled {
    color: #64748b;
    cursor: default;
  }
`;
