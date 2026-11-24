import React, { useEffect, useRef, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import Icon from './Icon';
import { mobileMaxWidth } from '~/constants/css';
import LumineAtWork from '~/containers/Build/PreviewPanel/LumineAtWork';

const PIXEL_FONT = "'Press Start 2P', monospace";

const enter = keyframes`
  from { opacity: 0; transform: translate(-50%, 24px); }
  to { opacity: 1; transform: translate(-50%, 0); }
`;

// "Lumine finished" (Mikey 11-24): shares the global toast queue with
// achievements and completions. Pixel Lumine celebrates a saved run (or
// rests after a stop), with a button back to the project. Like the other
// completion toasts, a background tab does not use up its time.
export default function LumineFinishedToast({
  title,
  message,
  success,
  actionLabel,
  duration = 14000,
  onClose,
  onClick,
  onShown
}: {
  title: string;
  message: string;
  success: boolean;
  actionLabel: string;
  duration?: number;
  onClose: () => void;
  onClick?: () => void;
  onShown?: () => void;
}) {
  const shownRef = useRef(false);
  const [hidden, setHidden] = useState(
    () => typeof document !== 'undefined' && document.hidden
  );
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function schedule() {
      clearTimeout(timer);
      setHidden(document.hidden);
      if (document.hidden) return;
      if (!shownRef.current) {
        shownRef.current = true;
        onShown?.();
      }
      timer = setTimeout(onClose, duration);
    }
    schedule();
    document.addEventListener('visibilitychange', schedule);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', schedule);
    };
  }, [duration, onClose, onShown]);

  return (
    <aside aria-label={title} className={cardCls} data-testid="lumine-finished-toast">
      <div className={sceneCls}>
        {hidden ? null : (
          <LumineAtWork
            variant="toast"
            mode="idle"
            startPose={success ? 'celebrate' : 'rest'}
          />
        )}
      </div>
      <div className={bodyCls}>
        <div role="status" aria-live="polite">
          <strong>{title}</strong>
          <p>{message}</p>
        </div>
        <button
          type="button"
          className={actionCls}
          onClick={() => {
            onClose();
            onClick?.();
          }}
        >
          {actionLabel} <Icon icon="arrow-right" />
        </button>
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
}

const cardCls = css`
  position: fixed;
  left: 50%;
  bottom: 3rem;
  z-index: 2147483000;
  width: min(92vw, 46rem);
  display: flex;
  align-items: center;
  gap: 1.4rem;
  padding: 1.1rem 4rem 1.1rem 1.1rem;
  border: 3px solid #2c2442;
  border-radius: 14px;
  background: #110d22;
  color: #ffffff;
  box-shadow:
    0 0 0 3px #0a0716,
    0 14px 36px rgba(10, 7, 22, 0.45);
  animation: ${enter} 260ms ease-out both;
  @media (max-width: ${mobileMaxWidth}) {
    bottom: calc(var(--mobile-nav-footprint) + 1rem);
    gap: 1rem;
    padding-right: 3.6rem;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: translateX(-50%);
  }
`;

const sceneCls = css`
  flex-shrink: 0;
  width: 112px;
  height: 100px;
  border: 2px solid #2c2442;
  border-radius: 8px;
  overflow: hidden;
  background: #1b1734;
  line-height: 0;
`;

const bodyCls = css`
  flex: 1;
  min-width: 0;
  strong {
    display: block;
    font-family: ${PIXEL_FONT};
    font-size: 12px;
    line-height: 1.6;
    color: #fff3c4;
  }
  p {
    margin: 0.45rem 0 0.8rem;
    font-size: 1.3rem;
    line-height: 1.4;
    color: #d8d0ea;
    overflow-wrap: anywhere;
  }
`;

const actionCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1.2rem;
  border: 2px solid #ffffff;
  border-radius: 8px;
  background: #ffd34d;
  color: #3b2200;
  font-size: 1.3rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 3px 0 #b88a00;
  &:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 #b88a00;
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
  color: #a99fc4;
  cursor: pointer;
  font-size: 1.5rem;
`;
