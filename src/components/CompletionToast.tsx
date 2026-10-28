import React, { useEffect, useRef, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import Icon from './Icon';
import Button from './Button';
import { mobileMaxWidth } from '~/constants/css';

const enter = keyframes`
  from { opacity: 0; transform: translate(-50%, 24px); }
  to { opacity: 1; transform: translate(-50%, 0); }
`;

// Shares the global queue with achievements, with an action for the saved result.
export default function CompletionToast({
  title,
  message,
  imageSrc,
  actionLabel,
  duration = 12000,
  onClose,
  onClick,
  onShown
}: {
  title: string;
  message: string;
  imageSrc?: string;
  actionLabel: string;
  duration?: number;
  onClose: () => void;
  onClick?: () => void | Promise<void>;
  onShown?: () => void;
}) {
  const shownRef = useRef(false);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState(false);
  useEffect(() => {
    // A background tab must not use up the time to read a notification.
    let timer: ReturnType<typeof setTimeout> | undefined;
    function schedule() {
      clearTimeout(timer);
      if (!document.hidden) {
        if (!shownRef.current) {
          shownRef.current = true;
          onShown?.();
        }
        if (!opening) timer = setTimeout(onClose, duration);
      }
    }
    schedule();
    document.addEventListener('visibilitychange', schedule);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', schedule);
    };
  }, [duration, onClose, onShown, opening]);

  return (
    <aside aria-label={title} className={cardCls}>
      {imageSrc ? <img src={imageSrc} alt="" /> : <Icon icon="palette" />}
      <div className={bodyCls}>
        <div role="status" aria-live="polite">
          <strong>{title}</strong>
          <p>{message}</p>
        </div>
        <Button
          loading={opening}
          size="sm"
          shape="pill"
          uppercase={false}
          onClick={handleOpen}
        >
          {opening ? 'Opening…' : actionLabel}
          {!opening && <Icon icon="arrow-right" />}
        </Button>
        {openError && <p role="alert">Couldn’t open it. Please try again.</p>}
      </div>
      <button
        type="button"
        className={closeCls}
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <Icon icon="times" />
      </button>
    </aside>
  );

  async function handleOpen() {
    if (opening) return;
    setOpening(true);
    setOpenError(false);
    try {
      await onClick?.();
      onClose();
    } catch {
      setOpenError(true);
      setOpening(false);
    }
  }
}

const cardCls = css`
  position: fixed;
  left: 50%;
  bottom: 3rem;
  z-index: 2147483000;
  width: min(92vw, 42rem);
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1.5rem 4.1rem 1.5rem 1.5rem;
  border: 1px solid #d9c6a9;
  border-radius: 16px;
  background: #fffdf8;
  color: #2f2a24;
  box-shadow:
    0 5px 0 #e4d5be,
    0 12px 32px rgba(47, 42, 36, 0.22);
  animation: ${enter} 260ms ease-out both;
  > img {
    width: 6.4rem;
    height: 6.4rem;
    flex-shrink: 0;
    object-fit: cover;
    border-radius: 10px;
    background: #f3ece0;
  }
  > svg {
    font-size: 3.2rem;
    color: #b4762a;
    flex-shrink: 0;
  }
  @media (max-width: ${mobileMaxWidth}) {
    bottom: calc(var(--mobile-nav-footprint) + 1rem);
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: translateX(-50%);
  }
`;
const bodyCls = css`
  flex: 1;
  min-width: 0;
  strong {
    display: block;
    font-size: 1.65rem;
    line-height: 1.25;
  }
  p {
    margin: 0.5rem 0 0.8rem;
    font-size: 1.25rem;
    line-height: 1.4;
  }
  button {
    display: inline-flex;
    gap: 0.6rem;
    align-items: center;
    border: none;
    border-radius: 999px;
    background: #2f2a24;
    color: #fffdf8;
    padding: 0.7rem 1.3rem;
    font-size: 1.3rem;
    font-weight: 700;
    cursor: pointer;
  }
`;
const closeCls = css`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 3.5rem;
  height: 3.5rem;
  border: none;
  background: transparent;
  color: #6b6157;
  cursor: pointer;
  font-size: 1.5rem;
`;
