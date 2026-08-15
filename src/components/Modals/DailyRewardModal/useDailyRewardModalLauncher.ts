import { useEffect, useRef, useState } from 'react';
import { loadDailyRewardModal } from './lazy';

const OPEN_RECOVERY_SHELL_AFTER_MS = 1000;

export default function useDailyRewardModalLauncher(
  onSetModalShown: (shown: boolean) => void
) {
  const [isOpening, setIsOpening] = useState(false);
  const isMountedRef = useRef(true);
  const isOpeningRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    void loadDailyRewardModal().catch(() => {});

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  async function openModal() {
    if (isOpeningRef.current) return;
    isOpeningRef.current = true;
    setIsOpening(true);

    let recoveryTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        loadDailyRewardModal(),
        new Promise<void>((resolve) => {
          recoveryTimer = setTimeout(resolve, OPEN_RECOVERY_SHELL_AFTER_MS);
        })
      ]);
    } catch {
      // Let the existing lazy-import recovery pipeline retry the failed chunk
      // inside Suspense, where it can offer a reload if this deploy is stale.
    } finally {
      if (recoveryTimer !== undefined) {
        clearTimeout(recoveryTimer);
      }
    }

    if (!isMountedRef.current) return;
    onSetModalShown(true);
    isOpeningRef.current = false;
    setIsOpening(false);
  }

  return { isOpening, openModal };
}
