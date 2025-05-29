import { useRef, useEffect, useCallback } from 'react';

interface EngineResult {
  success: boolean;
  move?: string;
  evaluation?: number;
  depth?: number;
  mate?: number; // Mate in N moves (negative = opponent gets mated)
  error?: string;
}

/**
 * Custom hook for using chess engine analysis via Web Worker.
 * This moves heavy computations off the main thread for better performance.
 * Includes debouncing to prevent multiple calls for the same position.
 */
export function useChessEngine() {
  const engineRef = useRef<Worker | null>(null);
  const cacheRef = useRef<Map<string, Promise<EngineResult>>>(new Map());

  useEffect(() => {
    // Initialize Web Worker on mount
    engineRef.current = new Worker('/engineWorker.js');

    return () => {
      // Clean up worker on unmount
      if (engineRef.current) {
        engineRef.current.terminate();
        engineRef.current = null;
      }
      cacheRef.current.clear();
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
        cacheRef.current.delete(fen); // Remove from cache once resolved
        resolve(event.data);
      };

      const handleError = (error: ErrorEvent) => {
        cleanup();
        cacheRef.current.delete(fen); // Remove from cache on error
        reject(error);
      };

      const cleanup = () => {
        engineRef.current?.removeEventListener('message', handleMessage);
        engineRef.current?.removeEventListener('error', handleError);
      };

      engineRef.current.addEventListener('message', handleMessage);
      engineRef.current.addEventListener('error', handleError);

      // Worker uses default depth of 18
      engineRef.current.postMessage({ fen });
    });

    // Cache the promise to prevent duplicate requests
    cacheRef.current.set(fen, promise);
    return promise;
  }, []);

  return { getBestMove };
}
