import React, { useRef, useEffect, useLayoutEffect } from 'react';

export function useAutoFollow<T extends HTMLElement>(
  ref: React.RefObject<T | null> | null,
  follow: boolean
) {
  const userPaused = useRef(false);

  useEffect(() => {
    const el = ref?.current;
    if (!el) return;

    const pause = () => (userPaused.current = true);

    el.addEventListener('wheel', pause, { passive: true });
    el.addEventListener('touchstart', pause, { passive: true });
    el.addEventListener('mousedown', pause, { passive: true });

    return () => {
      el.removeEventListener('wheel', pause);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('mousedown', pause);
    };
  });

  useLayoutEffect(() => {
    const el = ref?.current;
    if (!follow || !el) return;

    if (userPaused.current) return;

    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  });
}
