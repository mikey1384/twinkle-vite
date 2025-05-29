import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '~/contexts';
import type { ChessLevelsResponse } from '~/types/chess';

export function useChessLevels() {
  const loadChessLevels = useAppContext(
    (v) => v.requestHelpers.loadChessLevels
  );

  const [levels, setLevels] = useState<number[]>([]);
  const [maxLevelUnlocked, setMaxLevelUnlocked] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const resp = (await loadChessLevels()) as ChessLevelsResponse;

      // Extract level numbers from objects - simple and direct
      const levelNumbers = resp.levels.map((l) => l.level);

      setLevels(levelNumbers);
      setMaxLevelUnlocked(resp.maxLevelUnlocked);
    } catch (e: any) {
      setError(e.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { levels, maxLevelUnlocked, loading, error, refresh };
}
