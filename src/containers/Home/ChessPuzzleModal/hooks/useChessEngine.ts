import { useRef, useEffect, useCallback } from 'react';

interface EngineResult {
  success: boolean;
  move?: string;
  evaluation?: number;
  depth?: number;
  mate?: number;
  error?: string;
}

export function useChessEngine() {
  const engineRef = useRef<Worker | null>(null);
  const cacheRef = useRef<Map<string, Promise<EngineResult>>>(new Map());
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;

    // Capture cache reference for cleanup
    const cache = cacheRef.current;

    // Use proper bundler-compatible worker path
    try {
      engineRef.current = new Worker(
        new URL('/engineWorker.js', import.meta.url),
        {
          type: 'module'
        }
      );
    } catch (error) {
      console.error('Failed to initialize chess engine worker:', error);
      engineRef.current = null;
    }

    return () => {
      aliveRef.current = false;
      if (engineRef.current) {
        engineRef.current.terminate();
        engineRef.current = null;
      }
      // Clear cache using captured reference
      cache.clear();
    };
  }, []);

  const getBestMove = useCallback((fen: string): Promise<EngineResult> => {
    // Check if we already have a pending request for this position
    const existingPromise = cacheRef.current.get(fen);
    if (existingPromise) {
      return existingPromise;
    }

    const promise = new Promise<EngineResult>((resolve, reject) => {
      if (!engineRef.current) {
        resolve({ success: false, error: 'Worker not initialized' });
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        cleanup();
        // Only resolve if component is still mounted
        if (aliveRef.current) {
          resolve(event.data);
        }
        // Always remove from cache to prevent memory leaks
        cacheRef.current.delete(fen);
      };

      const handleError = (error: ErrorEvent) => {
        cleanup();
        // Only reject if component is still mounted
        if (aliveRef.current) {
          reject(error);
        }
        // Always remove from cache to prevent memory leaks
        cacheRef.current.delete(fen);
      };

      const cleanup = () => {
        if (engineRef.current) {
          engineRef.current.removeEventListener('message', handleMessage);
          engineRef.current.removeEventListener('error', handleError);
        }
      };

      engineRef.current.addEventListener('message', handleMessage);
      engineRef.current.addEventListener('error', handleError);

      // Wrap postMessage in try-catch to handle worker crashes
      try {
        engineRef.current.postMessage({ fen });
      } catch (_error) {
        cleanup();
        cacheRef.current.delete(fen);
        resolve({ success: false, error: 'Worker communication failed' });
      }
    });

    // Cache the promise to prevent duplicate requests
    cacheRef.current.set(fen, promise);

    // Implement simple LRU cache eviction (keep last 200 positions)
    if (cacheRef.current.size > 200) {
      const firstKey = cacheRef.current.keys().next().value;
      if (firstKey) {
        cacheRef.current.delete(firstKey);
      }
    }

    return promise;
  }, []);

  return { getBestMove };
}
