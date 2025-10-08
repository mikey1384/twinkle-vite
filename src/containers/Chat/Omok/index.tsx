import React, { useEffect, useMemo, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import {
  BOARD_SIZE,
  OmokColor,
  OmokCell,
  OmokMove,
  cloneBoard,
  createEmptyBoard,
  createsDoubleThree,
  isWinningMove,
  normaliseBoard
} from './helpers';

type PlayerColors = Record<number, OmokColor>;

interface PendingMoveState {
  board: OmokCell[][];
  move: OmokMove;
  playerColors: PlayerColors;
  isWinning: boolean;
  position: { row: number; col: number; color: OmokColor };
}

interface OmokProps {
  channelId: number;
  messageId?: number;
  myId: number;
  senderId?: number;
  opponentId?: number;
  opponentName?: string;
  initialState?: any;
  countdownNumber?: number;
  gameWinnerId?: number;
  moveViewed?: boolean;
  spoilerOff?: boolean;
  interactable?: boolean;
  loaded?: boolean;
  lastOmokMessageId?: number;
  onBoardClick?: () => void;
  onSpoilerClick?: (senderId: number) => void;
  onConfirmMove?: (params: {
    state: any;
    moveNumber: number;
    isWinning: boolean;
    previousState?: any;
  }) => void;
  onCancelPendingMove?: () => void;
  style?: React.CSSProperties;
}

const boardWrapperStyle: React.CSSProperties = {
  display: 'inline-block',
  background: '#f0d9b5',
  border: '1px solid #b8905d',
  padding: '0.5rem'
};

const rowStyle: React.CSSProperties = {
  display: 'flex'
};

function countPlaced(board: OmokCell[][]) {
  return board.reduce(
    (total, row) =>
      total +
      row.reduce(
        (rowSum, cell) =>
          rowSum + (cell === 'black' || cell === 'white' ? 1 : 0),
        0
      ),
    0
  );
}

export default function Omok({
  messageId,
  myId,
  senderId,
  opponentId,
  opponentName,
  initialState,
  countdownNumber,
  gameWinnerId,
  moveViewed,
  spoilerOff,
  interactable,
  loaded = true,
  lastOmokMessageId,
  onBoardClick,
  onSpoilerClick,
  onConfirmMove,
  onCancelPendingMove,
  style
}: OmokProps) {
  const baseBoard = useMemo(
    () =>
      initialState ? normaliseBoard(initialState.board) : createEmptyBoard(),
    [initialState]
  );
  const baseMoveNumber =
    typeof initialState?.move?.number === 'number'
      ? initialState.move.number
      : countPlaced(baseBoard);

  const [playerColors, setPlayerColors] = useState<PlayerColors>(
    initialState?.playerColors || {}
  );
  const [pendingMove, setPendingMove] = useState<PendingMoveState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setPlayerColors(initialState?.playerColors || {});
    setPendingMove(null);
    setErrorMessage(null);
  }, [initialState]);

  const boardToRender = pendingMove ? pendingMove.board : baseBoard;
  const stonesPlaced = countPlaced(baseBoard);
  const nextColor: OmokColor = stonesPlaced % 2 === 0 ? 'black' : 'white';

  const myAssignedColor: OmokColor = useMemo(() => {
    if (playerColors[myId]) return playerColors[myId];
    return nextColor;
  }, [playerColors, myId, nextColor]);

  const isMyTurn =
    Boolean(interactable && spoilerOff && loaded) &&
    !pendingMove &&
    myAssignedColor === nextColor;

  const lastMovePosition = pendingMove
    ? pendingMove.position
    : initialState?.move?.position || null;

  function ensurePlayerColors(): PlayerColors {
    let updated: PlayerColors = { ...playerColors };
    if (!updated[myId]) {
      updated[myId] = myAssignedColor;
      if (opponentId) {
        const opponentColor: OmokColor =
          myAssignedColor === 'black' ? 'white' : 'black';
        if (!updated[opponentId]) {
          updated[opponentId] = opponentColor;
        }
      }
    }
    return updated;
  }

  function handleCellClick(row: number, col: number) {
    if (!isMyTurn) {
      if (interactable) {
        setErrorMessage("It's not your turn yet.");
      }
      return;
    }
    if (baseBoard[row][col]) {
      setErrorMessage('That intersection is already taken.');
      return;
    }

    const updatedColors = ensurePlayerColors();

    const move: OmokMove = {
      number: baseMoveNumber + 1,
      by: myId,
      position: { row, col }
    };

    const boardBeforeMove = cloneBoard(baseBoard);
    if (
      createsDoubleThree({
        board: boardBeforeMove,
        move,
        color: myAssignedColor
      })
    ) {
      setErrorMessage('Double-three is not allowed.');
      return;
    }

    const boardAfterMove = cloneBoard(baseBoard);
    boardAfterMove[row][col] = myAssignedColor;
    const winning = isWinningMove({
      board: boardAfterMove,
      move,
      color: myAssignedColor
    });

    setPendingMove({
      board: boardAfterMove,
      move,
      playerColors: updatedColors,
      isWinning: winning,
      position: { row, col, color: myAssignedColor }
    });
    setErrorMessage(null);
  }

  function handleConfirmMove() {
    if (!pendingMove) return;
    onConfirmMove?.({
      state: {
        board: pendingMove.board,
        move: pendingMove.move,
        playerColors: pendingMove.playerColors,
        ...(pendingMove.isWinning ? { winnerId: myId } : {})
      },
      moveNumber: pendingMove.move.number,
      isWinning: pendingMove.isWinning,
      previousState: initialState
    });
    setPlayerColors(pendingMove.playerColors);
    setPendingMove(null);
    setErrorMessage(null);
  }

  function handleCancelMove() {
    setPendingMove(null);
    setErrorMessage(null);
    onCancelPendingMove?.();
  }

  function handleSpoilerToggle() {
    if (!spoilerOff && onSpoilerClick && typeof senderId === 'number') {
      onSpoilerClick(senderId);
    }
  }

  const winnerId = initialState?.winnerId || gameWinnerId;

  return (
    <div style={{ width: '100%', ...style }}>
      {!spoilerOff ? (
        <div
          onClick={handleSpoilerToggle}
          style={{
            border: '1px dashed #b8905d',
            padding: '1rem',
            cursor: 'pointer',
            textAlign: 'center',
            background: '#fff4dc'
          }}
        >
          <Icon icon="eye-slash" />
          <span style={{ marginLeft: '0.5rem' }}>Show Omok board</span>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '1rem' }}>
            {typeof countdownNumber === 'number' && (
              <div style={{ fontWeight: 'bold' }}>
                {countdownNumber > 0
                  ? `Time remaining: ${(countdownNumber / 10).toFixed(1)}s`
                  : 'Time expired'}
              </div>
            )}
            {winnerId ? (
              <div style={{ color: '#148a14', fontWeight: 'bold' }}>
                {winnerId === myId
                  ? 'You won the omok match'
                  : winnerId === opponentId
                  ? `${opponentName || 'Opponent'} won the omok match`
                  : 'Omok match finished'}
              </div>
            ) : interactable ? (
              <div style={{ color: isMyTurn ? '#148a14' : '#777' }}>
                {isMyTurn ? 'Your move' : 'Waiting for opponent'}
              </div>
            ) : null}
          </div>
          <div
            style={{
              ...boardWrapperStyle,
              cursor:
                !interactable && onBoardClick ? 'pointer' : 'default'
            }}
            onClick={() => {
              if (!interactable && onBoardClick) {
                onBoardClick();
              }
            }}
          >
            {Array.from({ length: BOARD_SIZE }).map((_, row) => (
              <div key={row} style={rowStyle}>
                {Array.from({ length: BOARD_SIZE }).map((__, col) => {
                  const cell = boardToRender[row][col];
                  const isLastMove =
                    lastMovePosition &&
                    lastMovePosition.row === row &&
                    lastMovePosition.col === col;
                  return (
                    <OmokCell
                      key={col}
                      value={cell}
                      isLastMove={isLastMove}
                      canInteract={Boolean(isMyTurn && !cell && !pendingMove)}
                      onClick={() => handleCellClick(row, col)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          {errorMessage && (
            <div style={{ color: '#d94848', marginTop: '0.5rem' }}>
              {errorMessage}
            </div>
          )}
          {interactable && pendingMove && (
            <div
              style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}
            >
              <Button color="green" onClick={handleConfirmMove}>
                <Icon icon="check" />
                <span style={{ marginLeft: '0.5rem' }}>Confirm move</span>
              </Button>
              <Button transparent onClick={handleCancelMove}>
                <Icon icon="undo" />
                <span style={{ marginLeft: '0.5rem' }}>Cancel</span>
              </Button>
            </div>
          )}
          {interactable && !pendingMove && (
            <div style={{ marginTop: '0.75rem', color: '#777' }}>
              {isMyTurn
                ? 'Select an empty intersection to place your stone.'
                : "Waiting for opponent's move."}
            </div>
          )}
          {!interactable &&
            !moveViewed &&
            lastOmokMessageId &&
            messageId === lastOmokMessageId && (
              <div style={{ marginTop: '0.75rem', color: '#777' }}>
                Click the board to start your timer.
              </div>
            )}
        </>
      )}
    </div>
  );
}

interface CellProps {
  value: OmokCell;
  isLastMove: boolean;
  canInteract: boolean;
  onClick: () => void;
}

function OmokCell({ value, isLastMove, canInteract, onClick }: CellProps) {
  const baseStyle: React.CSSProperties = {
    width: 28,
    height: 28,
    border: '1px solid rgba(0,0,0,0.2)',
    background:
      'linear-gradient(45deg, rgba(222, 184, 135, 0.7), rgba(245, 222, 179, 0.8))',
    position: 'relative',
    cursor: canInteract ? 'pointer' : 'default'
  };

  const stoneStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 18,
    height: 18,
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
  };

  let stone: React.ReactNode = null;
  if (value === 'black') {
    stone = (
      <div
        style={{
          ...stoneStyle,
          background: '#1f1f1f',
          border: '1px solid rgba(0,0,0,0.5)'
        }}
      />
    );
  } else if (value === 'white') {
    stone = (
      <div
        style={{
          ...stoneStyle,
          background: '#fdfdfd',
          border: '1px solid rgba(0,0,0,0.2)'
        }}
      />
    );
  }

  return (
    <div
      role={canInteract ? 'button' : 'presentation'}
      style={{
        ...baseStyle,
        boxShadow: isLastMove
          ? '0 0 0 2px rgba(39, 111, 255, 0.5)'
          : baseStyle.boxShadow
      }}
      onClick={onClick}
    >
      {stone}
    </div>
  );
}
