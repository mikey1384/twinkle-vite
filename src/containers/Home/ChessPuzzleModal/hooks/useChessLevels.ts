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
      setLevels(levels.map((l: any) => l.level));
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
