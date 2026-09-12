import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import DropdownList from '~/components/DropdownList';
import Icon from '~/components/Icon';
import zeroFace from '~/assets/zero.png';
import cielFace from '~/assets/ciel.png';
import type { HomeCallAssistant } from '~/helpers/aiVoiceCall';

export default function CallPartnerChooser({
  value,
  disabled,
  onChange,
  onOpenChange
}: {
  value: HomeCallAssistant;
  disabled: boolean;
  onChange: (assistant: HomeCallAssistant) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const open = Boolean(anchor) && !disabled;

  useEffect(() => {
    if (disabled && anchor) {
      setAnchor(null);
      onOpenChange(false);
    }
  }, [anchor, disabled, onOpenChange]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={`Choose call partner, currently ${value}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
        className={css`
          flex: 0 0 3.4rem;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          padding: 0.4rem;
          border: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.35);
          background: transparent;
          color: inherit;
          font: inherit;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          &:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.16);
          }
          &:focus-visible {
            outline: 2px solid currentColor;
            outline-offset: -3px;
          }
          &:disabled {
            cursor: default;
            opacity: 0.65;
          }
        `}
      >
        {value}
        <Icon icon="chevron-down" />
      </button>
      {open && anchor && (
        <DropdownList
          dropdownContext={anchor}
          triggerRef={triggerRef}
          onHideMenu={handleClose}
          style={{ minWidth: '15rem', padding: '0.5rem' }}
        >
          <div
            ref={menuRef}
            role="menu"
            aria-label="Call partner"
            onKeyDown={handleMenuKeyDown}
          >
            {(['Zero', 'Ciel'] as const).map((assistant) => (
              <button
                key={assistant}
                type="button"
                role="menuitemradio"
                aria-checked={assistant === value}
                autoFocus={assistant === value}
                onClick={() => handleChoose(assistant)}
                className={css`
                  display: flex;
                  align-items: center;
                  gap: 0.8rem;
                  width: 100%;
                  padding: 0.7rem;
                  border: none;
                  border-radius: 0.6rem;
                  background: ${assistant === value ? 'var(--ui-bg-soft, #edf3fa)' : 'transparent'};
                  color: var(--ui-text, #334155);
                  font-size: 1.3rem;
                  font-weight: 700;
                  text-align: left;
                  cursor: pointer;
                  &:hover,
                  &:focus-visible {
                    background: #eaf0f7;
                    outline: none;
                  }
                `}
              >
                <img
                  src={assistant === 'Zero' ? zeroFace : cielFace}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: '2.8rem',
                    height: '2.8rem',
                    flexShrink: 0,
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
                <span style={{ flex: 1 }}>{assistant}</span>
                {assistant === value && <Icon icon="check" />}
              </button>
            ))}
          </div>
        </DropdownList>
      )}
    </>
  );

  function handleToggle() {
    if (open) return handleClose();
    setAnchor(triggerRef.current?.getBoundingClientRect() || null);
    onOpenChange(true);
  }

  function handleClose() {
    setAnchor(null);
    onOpenChange(false);
  }

  function handleChoose(assistant: HomeCallAssistant) {
    onChange(assistant);
    handleClose();
    triggerRef.current?.focus();
  }

  function handleMenuKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
      triggerRef.current?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const buttons = [
        ...(menuRef.current?.querySelectorAll<HTMLButtonElement>('button') ||
          [])
      ];
      const current = buttons.indexOf(
        document.activeElement as HTMLButtonElement
      );
      buttons[
        (current + (event.key === 'ArrowDown' ? 1 : buttons.length - 1)) %
          buttons.length
      ]?.focus();
    } else if (event.key === 'Tab') {
      handleClose();
    }
  }
}
