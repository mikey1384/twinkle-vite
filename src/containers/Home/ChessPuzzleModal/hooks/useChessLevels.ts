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
      const resp = await getLevels();

      // 1️⃣ normalise the levels array (numbers or objects)
      const levelArr = Array.isArray(resp.levels)
        ? typeof resp.levels[0] === 'number'
          ? resp.levels
          : resp.levels.map((l: any) => l.level)
        : [];
      setLevels(levelArr);

      // 2️⃣ determine how many are unlocked
      const unlocked =
        // new backend shape: { maxLevelUnlocked: 3 }
        resp.maxLevelUnlocked ??
        // old backend shape:   { maxUnlocked: 3 }
        resp.maxUnlocked ??
        // derive from levels list: [{level, unlocked:true}, …]
        (Array.isArray(resp.levels)
          ? Math.max(
              1,
              ...resp.levels
                .filter((l: any) => l.unlocked)
                .map((l: any) => l.level)
            )
          : 1);

      setMaxUnlocked(unlocked);
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
