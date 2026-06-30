import React, { useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function Toast({
  message,
  onClose,
  onClick,
  duration = 4000
}: {
  message: string;
  onClose: () => void;
  onClick?: () => void;
  duration?: number;
}) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onCloseRef.current(), duration);
    return () => clearTimeout(timer);
  }, [message, duration]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onClick || onClose}
      className={css`
        position: fixed;
        left: 50%;
        bottom: 3rem;
        transform: translateX(-50%);
        z-index: 2147483000;
        max-width: 90vw;
        padding: 1.2rem 1.6rem;
        border-radius: 0.7rem;
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        font-size: 1.3rem;
        line-height: 1.4;
        text-align: center;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        cursor: pointer;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.1rem;
          /* Clear the mobile bottom nav (Header pinned bottom). */
          bottom: calc(var(--mobile-nav-height, 7rem) + 1rem);
        }
      `}
    >
      {message}
    </div>
  );
}
