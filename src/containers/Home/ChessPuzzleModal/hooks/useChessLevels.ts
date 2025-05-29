import { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '~/contexts';

export function useChessLevels() {
  const getLevels = useAppContext((v) => v.requestHelpers.loadChessLevels);
  const [levels, setLevels] = useState<number[]>([]);
  const [maxUnlocked, setMaxUnlocked] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { levels, maxLevelUnlocked } = await getLevels();
      // Handle both array of numbers and array of objects
      setLevels(
        Array.isArray(levels)
          ? typeof levels[0] === 'number'
            ? levels
            : levels.map((l: any) => l.level)
          : []
      );
      setMaxUnlocked(maxLevelUnlocked);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [getLevels]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { levels, maxUnlocked, loading, error, refresh };
}
