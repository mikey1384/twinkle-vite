import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect
} from 'react';
import { ChessStats } from '~/types/chess';
import { useAppContext } from '~/contexts';

interface ChessStatsContextValue {
  stats: ChessStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  setStats: (stats: ChessStats | null) => void;
  updateStats: (partial: Partial<ChessStats>) => void;
}

const ChessStatsContext = createContext<ChessStatsContextValue | undefined>(
  undefined
);

export function ChessStatsProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const loadChessStats = useAppContext((v) => v.requestHelpers.loadChessStats);

  const [stats, setStats] = useState<ChessStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const refreshStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadChessStats();
      if (data) {
        setStats(data);
        setHasLoadedOnce(true);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load chess stats');
    } finally {
      setLoading(false);
    }
  }, [loadChessStats]);

  const updateStats = useCallback((partial: Partial<ChessStats>) => {
    setStats((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  // Load once on mount
  useEffect(() => {
    if (!hasLoadedOnce && !loading) {
      refreshStats();
    }
  }, [refreshStats, hasLoadedOnce, loading]);

  const value = React.useMemo(
    () => ({
      stats,
      loading,
      error,
      refreshStats,
      setStats,
      updateStats
    }),
    [stats, loading, error, refreshStats, updateStats]
  );

  return (
    <ChessStatsContext.Provider value={value}>
      {children}
    </ChessStatsContext.Provider>
  );
}

export function useChessStatsContext() {
  const context = useContext(ChessStatsContext);
  if (!context) {
    throw new Error(
      'useChessStatsContext must be used within ChessStatsProvider'
    );
  }
  return context;
}
