import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import AiEnergyRefillNotice from '~/components/AiEnergyRefillNotice';
import type { AiEnergyDisplayPolicy } from '~/helpers/aiEnergyDisplay';

export default function AiEnergyRefillInfoButton({
  energyPolicy,
  onRefresh,
  active = true
}: {
  energyPolicy?: AiEnergyDisplayPolicy | null;
  onRefresh: () => void;
  active?: boolean;
}) {
  const [shown, setShown] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const open = shown && active;
  const positioned = position !== null;

  useEffect(() => {
    if (!active) setShown(false);
  }, [active]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    if (panelRef.current) observer.observe(panelRef.current);
    if (buttonRef.current?.parentElement)
      observer.observe(buttonRef.current.parentElement);
    window.addEventListener('resize', dismiss);
    window.addEventListener('scroll', handleScroll, true);
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('focusin', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('focusin', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };

    function updatePosition() {
      const button = buttonRef.current?.getBoundingClientRect();
      const panel = panelRef.current?.getBoundingClientRect();
      if (!button || !panel) return;
      const margin = 12;
      const left = Math.max(
        margin,
        Math.min(
          button.right - panel.width,
          window.innerWidth - panel.width - margin
        )
      );
      const below = button.bottom + 8;
      const top = Math.max(
        margin,
        below + panel.height <= window.innerHeight - margin
          ? below
          : button.top - panel.height - 8
      );
      setPosition((previous) =>
        previous?.top === top && previous.left === left
          ? previous
          : { top, left }
      );
    }

    function dismiss() {
      setShown(false);
    }

    function handleOutside(event: Event) {
      const target = event.target;
      if (
        target instanceof Node &&
        !buttonRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      )
        dismiss();
    }

    function handleScroll(event: Event) {
      if (
        !(event.target instanceof Node) ||
        !panelRef.current?.contains(event.target)
      )
        dismiss();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      dismiss();
      buttonRef.current?.focus();
    }
  }, [open]);

  useLayoutEffect(() => {
    // Focus only after the panel becomes visible, not on its hidden measuring
    // render or on later position updates while someone uses its contents.
    if (open && positioned) panelRef.current?.focus();
  }, [open, positioned]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={buttonCls}
        aria-label="AI Energy refill details"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-haspopup="dialog"
        onClick={handleToggle}
      >
        <Icon icon="exclamation-circle" />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            tabIndex={-1}
            aria-label="AI Energy refill details"
            className={panelCls}
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              visibility: position ? 'visible' : 'hidden'
            }}
          >
            <AiEnergyRefillNotice
              energyPolicy={energyPolicy}
              onRefresh={handleRefresh}
            />
          </div>,
          document.getElementById('outer-layer') || document.body
        )}
    </>
  );

  function handleToggle() {
    setPosition(null);
    setShown((value) => !value);
  }

  function handleRefresh() {
    setShown(false);
    onRefresh();
  }
}

const buttonCls = css`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.45rem;
  height: 2.45rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #52647c;
  font-size: 1.5rem;
  cursor: pointer;
  &:hover,
  &:focus-visible,
  &[aria-expanded='true'] {
    color: #1d4ed8;
    background: rgba(65, 140, 235, 0.08);
    outline: 2px solid rgba(65, 140, 235, 0.35);
    outline-offset: 1px;
  }
`;

const panelCls = css`
  position: fixed;
  z-index: 100000001;
  box-sizing: border-box;
  width: min(28rem, calc(100vw - 24px));
  max-height: calc(100vh - 24px);
  overflow-y: auto;
  padding: 0.9rem 1.1rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  box-shadow: 0 5px 18px rgba(15, 23, 42, 0.16);
  pointer-events: auto;
  text-align: left;
`;
