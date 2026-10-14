import { useEffect, useRef, useState } from 'react';

// Keep the spinner on the action that started the request and guard repeated
// clicks/Enter before React has committed the disabled button state.
export default function usePendingAction() {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return { pendingAction, runAction };

  async function runAction<T>(key: string, action: () => Promise<T>) {
    if (!mounted.current || inFlight.current) return;
    inFlight.current = true;
    setPendingAction(key);
    try {
      return await action();
    } finally {
      inFlight.current = false;
      if (mounted.current) setPendingAction(null);
    }
  }
}
