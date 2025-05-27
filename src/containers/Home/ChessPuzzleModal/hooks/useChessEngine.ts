import { useRef, useEffect, useCallback } from 'react';

interface EngineResult {
  success: boolean;
  move?: string;
  evaluation?: number;
  depth?: number;
  error?: string;
}

/**
 * Custom hook for using chess engine analysis via Web Worker.
 * This moves heavy computations off the main thread for better performance.
 */
export function useChessEngine() {
  const engineRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize Web Worker on mount
    engineRef.current = new Worker('/engineWorker.js');

    return () => {
      // Clean up worker on unmount
      if (engineRef.current) {
        engineRef.current.terminate();
        engineRef.current = null;
      }
    };
  }, []);

  const getBestMove = useCallback((fen: string): Promise<EngineResult> => {
    return new Promise((resolve, reject) => {
      if (!engineRef.current) {
        resolve({ success: false, error: 'Worker not initialized' });
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        cleanup();
        resolve(event.data);
      };

      const handleError = (error: ErrorEvent) => {
        cleanup();
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
  }, []);

  return { getBestMove };
}
