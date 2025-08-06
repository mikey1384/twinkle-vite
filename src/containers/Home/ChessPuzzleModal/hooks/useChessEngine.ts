import { useCallback, useState, useRef, useEffect } from 'react';

interface EngineResult {
  success: boolean;
  move?: string;
  evaluation?: number;
  depth?: number;
  mate?: number;
  error?: string;
}

export function useChessEngine() {
  const [isReady, setIsReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const pendingRequests = useRef<Map<number, (result: EngineResult) => void>>(
    new Map()
  );

  const initializeEngine = useCallback(() => {
    try {
      workerRef.current = new Worker('/stockfish-worker.js');

      workerRef.current.onmessage = (e) => {
        const { type, requestId, result, error } = e.data;

        if (type === 'ready' || type === 'initialized') {
          setIsReady(true);
        } else if (type === 'error') {
          console.error('Stockfish error:', error);
          setIsReady(false);

          pendingRequests.current.forEach((resolve) => {
            resolve({
              success: false,
              error: error || 'Engine error'
            });
          });
          pendingRequests.current.clear();
        } else if (
          type === 'result' &&
          requestId &&
          pendingRequests.current.has(requestId)
        ) {
          const resolve = pendingRequests.current.get(requestId);
          if (resolve) {
            resolve(result);
            pendingRequests.current.delete(requestId);
          }
        } else if (type === 'debug') {
          // Suppress debug messages
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Stockfish worker error:', error);
        setIsReady(false);
      };

      // Initialize the engine
      workerRef.current.postMessage({ type: 'init' });
    } catch (error) {
      console.error('Failed to initialize Stockfish worker:', error);
      setIsReady(false);
    }
  }, []);

  const evaluatePosition = useCallback(
    async (
      fen: string,
      depth: number = 15,
      timeoutMs: number = 5000
    ): Promise<EngineResult> => {
      if (!workerRef.current || !isReady) {
        return {
          success: false,
          error: 'Engine not ready'
        };
      }

      return new Promise((resolve) => {
        const requestId = ++requestIdRef.current;

        // Set up timeout
        const timeout = setTimeout(() => {
          if (pendingRequests.current.has(requestId)) {
            pendingRequests.current.delete(requestId);
            resolve({
              success: false,
              error: 'Evaluation timeout'
            });
          }
        }, timeoutMs);

        // Store the resolver
        pendingRequests.current.set(requestId, (result: EngineResult) => {
          clearTimeout(timeout);
          resolve(result);
        });

        // Send evaluation request
        workerRef.current!.postMessage({
          type: 'evaluate',
          requestId,
          data: { fen, depth }
        });
      });
    },
    [isReady]
  );

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ command: 'terminate' });
      workerRef.current.terminate();
      workerRef.current = null;
      setIsReady(false);
      pendingRequests.current.clear();
    }
  }, []);

  useEffect(() => {
    initializeEngine();
    return terminate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminate]);

  return {
    isReady,
    evaluatePosition,
    terminate
  };
}
