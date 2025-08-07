import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { uciToSquareIndices } from '../../helpers';

interface EngineResult {
  success: boolean;
  move?: string;
  evaluation?: number;
  depth?: number;
  mate?: number;
  error?: string;
}

interface MakeEngineMoveParams {
  chessInstance: Chess;
  moveUci: string;
  solutionPlayingRef: React.MutableRefObject<boolean>;
  onMoveAnalysisUpdate?: (entry: any) => void;
  onBoardStateUpdate?: (updateFn: (prev: any) => any) => void;
  applyCheckmateHighlighting?: (board: any[]) => void;
}

export function useChessMove() {
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

  const makeEngineMove = useCallback(
    ({
      chessInstance,
      moveUci,
      solutionPlayingRef,
      onMoveAnalysisUpdate,
      onBoardStateUpdate,
      applyCheckmateHighlighting
    }: MakeEngineMoveParams) => {
      if (!chessInstance) return;

      const { from } = uciToSquareIndices(moveUci);

      const move = chessInstance.move({
        from: moveUci.slice(0, 2),
        to: moveUci.slice(2, 4),
        promotion: moveUci.length > 4 ? moveUci.slice(4) : undefined
      });

      if (!move) {
        console.error('Invalid engine move:', moveUci);
        return;
      }

      if (!solutionPlayingRef.current && isReady && onMoveAnalysisUpdate) {
        const engineAnalysisEntry = {
          userMove: `${move.from}${move.to}${move.promotion || ''}`,
          expectedMove: undefined,
          engineSuggestion: undefined,
          evaluation: undefined,
          mate: undefined,
          isCorrect: true,
          timestamp: Date.now(),
          isEngine: true
        };

        onMoveAnalysisUpdate(engineAnalysisEntry);
      }

      const isPositionCheckmate = chessInstance?.isCheckmate() || false;

      if (onBoardStateUpdate) {
        onBoardStateUpdate((prev) => {
          if (!prev) return prev;

          const newBoard = [...prev.board];
          let movingPiece = { ...newBoard[from] };
          const toIndex = uciToSquareIndices(moveUci).to;

          if (move.san.includes('=')) {
            const promotionPiece = move.san.slice(-1).toLowerCase();
            const pieceTypeMap: { [key: string]: string } = {
              q: 'queen',
              r: 'rook',
              b: 'bishop',
              n: 'knight'
            };
            movingPiece.type = pieceTypeMap[promotionPiece] || 'queen';
          }

          if (move.san === 'O-O' || move.san === 'O-O-O') {
            const isKingside = move.san === 'O-O';
            const isWhite = movingPiece.color === 'white';

            let kingDest: number;
            let rookFrom: number;
            let rookDest: number;

            if (isWhite) {
              if (isKingside) {
                kingDest = 62; // g1
                rookFrom = 63; // h1
                rookDest = 61; // f1
              } else {
                kingDest = 58; // c1
                rookFrom = 56; // a1
                rookDest = 59; // d1
              }
            } else {
              if (isKingside) {
                kingDest = 6; // g8
                rookFrom = 7; // h8
                rookDest = 5; // f8
              } else {
                kingDest = 2; // c8
                rookFrom = 0; // a8
                rookDest = 3; // d8
              }
            }

            const kingPiece = { ...newBoard[from] };
            kingPiece.state = 'arrived';
            newBoard[kingDest] = kingPiece;
            newBoard[from] = {};

            const rookPiece = { ...newBoard[rookFrom] };
            rookPiece.state = 'arrived';
            newBoard[rookDest] = rookPiece;
            newBoard[rookFrom] = {};
          } else {
            movingPiece.state = 'arrived';
            newBoard[toIndex] = movingPiece;
            newBoard[from] = {};
          }

          newBoard.forEach((square, i) => {
            if ('state' in square && square.state === 'arrived') {
              const justMoved =
                move.san === 'O-O' || move.san === 'O-O-O'
                  ? false
                  : i === toIndex;
              if (!justMoved && !(move.san === 'O-O' || move.san === 'O-O-O')) {
                square.state = '';
              }
            }
            if (
              solutionPlayingRef.current &&
              square.state &&
              square.state !== 'arrived' &&
              square.state !== 'checkmate'
            ) {
              delete square.state;
            }
          });

          if (isPositionCheckmate && applyCheckmateHighlighting) {
            applyCheckmateHighlighting(newBoard);
          }

          return {
            ...prev,
            board: newBoard,
            isCheckmate: isPositionCheckmate
          };
        });
      }
    },
    [isReady]
  );

  useEffect(() => {
    initializeEngine();
    return terminate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminate]);

  return {
    isReady,
    evaluatePosition,
    terminate,
    makeEngineMove
  };
}
