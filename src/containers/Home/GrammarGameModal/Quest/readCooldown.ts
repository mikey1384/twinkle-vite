import { useEffect, useMemo, useState } from 'react';

export const READ_MIN_MS = 3000;

// After a miss the explanation shows and Continue waits a short read time
// (Mikey 10-07: even a lucky tapper reads what they got wrong). `key` names
// the card on screen (null when none); the wait starts when it appears.
export function useReadCooldown(key: string | null, readMs?: number) {
  // set during render so no keypress can slip in before the wait begins
  const until = useMemo(
    () => (key ? Date.now() + (readMs || READ_MIN_MS) : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    setNow(Date.now());
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= until) clearInterval(timer);
    }, 200);
    return () => clearInterval(timer);
  }, [until]);
  const leftMs = Math.max(0, until - now);
  return { reading: !!key && leftMs > 0, secondsLeft: Math.ceil(leftMs / 1000) };
}
