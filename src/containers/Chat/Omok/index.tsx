import React, { useEffect, useMemo, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { isMobile } from '~/helpers';
import {
  BOARD_SIZE,
  OmokCell,
  OmokColor,
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
  // lifted-state API for modal (mirrors chess pattern)
  newOmokState?: any;
  onSetNewOmokState?: (state: any | null) => void;
}

const deviceIsMobile = isMobile(navigator);
const COLUMN_LABELS = Array.from({ length: BOARD_SIZE }, (_, index) =>
  String.fromCharCode('A'.charCodeAt(0) + index)
);
const ROW_LABELS = Array.from(
  { length: BOARD_SIZE },
  (_, index) => BOARD_SIZE - index
);

const containerClass = css`
  position: relative;
  width: 100%;
  user-select: none;
  font: 14px 'Century Gothic', Futura, sans-serif;
`;

const boardShellClass = css`
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

/*
  New grid layout: one unified CSS grid so labels align perfectly with columns/rows.
  Grid columns: [label] + 15 cell tracks
  Grid rows:   15 cell tracks + [label]
*/
const alignGridClass = css`
  display: grid;
  grid-template-columns: 2rem repeat(${BOARD_SIZE}, 1fr);
  grid-template-rows: repeat(${BOARD_SIZE}, 1fr) 2rem;
  align-items: stretch;
  justify-items: stretch;
  padding: 1.2rem;
  background: ${Color.white(0.95)};
  border: 1px solid ${Color.borderGray()};
  border-radius: ${borderRadius};
  box-shadow: 0 0.5rem 2rem ${Color.black(0.08)};
  position: relative;
  width: calc(var(--omok-board-size) + 2rem);
  height: calc(var(--omok-board-size) + 2rem);
  transition: box-shadow 0.3s ease;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0.75rem;
  }
`;

const rowLabelClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${Color.darkGray()};
  font-weight: bold;
`;

const colLabelClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${Color.darkGray()};
  font-weight: bold;
`;

const boardPlaneClass = css`
  position: relative;
  border-radius: ${borderRadius};
  box-shadow: inset 0 0 0 2px ${Color.lightBrown()};
  background: repeating-linear-gradient(
      to right,
      rgba(0, 0, 0, 0.18) 0 1px,
      transparent 1px calc(100% / ${BOARD_SIZE})
    ),
    repeating-linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.18) 0 1px,
      transparent 1px calc(100% / ${BOARD_SIZE})
    ),
    linear-gradient(
      135deg,
      rgba(214, 183, 126, 0.55),
      rgba(240, 215, 168, 0.75)
    );
`;

const cellsGridClass = css`
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(${BOARD_SIZE}, 1fr);
  grid-template-rows: repeat(${BOARD_SIZE}, 1fr);
`;

const hiddenBoardWrapperClass = css`
  width: calc(var(--omok-board-size) + 2.4rem);
  height: calc(var(--omok-board-size) + 2.4rem);
  padding: 1.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    width: calc(var(--omok-board-size) + 2rem);
    height: calc(var(--omok-board-size) + 2rem);
    padding: 0.75rem;
  }
`;

const hiddenBoardClass = css`
  width: 100%;
  height: 100%;
  border-radius: ${borderRadius};
  border: 2px dashed ${Color.brownOrange(0.7)};
  background: ${Color.white(0.95)};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 1rem;
  padding: 1.5rem;
  cursor: pointer;
  color: ${Color.darkGray()};
  box-shadow: 0 0.5rem 2rem ${Color.black(0.08)};
  font-size: 1.5rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.75rem;
    padding: 1rem;
    font-size: 1.4rem;
  }
`;

const topInfoClass = css`
  top: 1rem;
  left: 1rem;
  padding: 0.5rem 1rem;
  background: ${Color.white(0.9)};
  border: 1px solid ${Color.darkGray()};
  position: absolute;
  font-size: 1.5rem;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  @media (max-width: ${mobileMaxWidth}) {
    top: 0;
    left: 0.5rem;
    width: CALC(100% - 5rem);
    position: relative;
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
`;

const topSpacerClass = css`
  height: 4.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1.5rem;
  @media (max-width: ${mobileMaxWidth}) {
    margin-top: 0.5rem;
    margin-bottom: 1rem;
    height: 3rem;
  }
`;

const bottomSpacerClass = css`
  height: 6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  position: relative;
  margin-top: 1.2rem;
`;

const instructionsClass = css`
  color: ${Color.darkGray()};
  font-size: 1.6rem;
  text-align: center;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.4rem;
  }
`;

const pendingButtonsClass = css`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const errorOverlayClass = css`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border-radius: ${borderRadius};
  background: ${Color.black(0.75)};
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.6rem;
  box-shadow: 0 0.5rem 2rem ${Color.black(0.25)};
`;

const resultOverlayClass = css`
  color: #fff;
  font-size: 2.5rem;
  font-weight: bold;
  padding: 1rem 2rem;
  text-align: center;
  border-radius: ${borderRadius};
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.8rem;
    padding: 0.75rem 1.5rem;
  }
`;

const statusOverlayClass = css`
  padding: 0.5rem 1rem;
  background: ${Color.white(0.9)};
  border: 1px solid ${Color.darkGray()};
  bottom: 1rem;
  right: 1rem;
  position: absolute;
  font-size: 2.5rem;
  font-weight: bold;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.5rem;
  }
`;

const omokCellClass = css`
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(222, 184, 135, 0.65),
    rgba(245, 222, 179, 0.78)
  );
  transition: background 0.2s ease, transform 0.15s ease;
  &:hover {
    transform: translateZ(0);
  }
`;

const stoneBaseClass = css`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70%;
  height: 70%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.2);
`;

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
  style,
  newOmokState,
  onSetNewOmokState
}: OmokProps) {
  const boardSize = useMemo(
    () => (deviceIsMobile ? 'min(85vw, 60vh)' : 'min(60vh, 60vw)'),
    []
  );
  const boardSizeStyle = useMemo(
    () =>
      ({
        '--omok-board-size': boardSize
      } as React.CSSProperties),
    [boardSize]
  );

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

  const boardToRender = newOmokState
    ? newOmokState.board
    : pendingMove
    ? pendingMove.board
    : baseBoard;
  const stonesPlaced = countPlaced(baseBoard);
  const nextColor: OmokColor = stonesPlaced % 2 === 0 ? 'black' : 'white';

  const myAssignedColor: OmokColor = useMemo(() => {
    if (playerColors[myId]) return playerColors[myId];
    return nextColor;
  }, [playerColors, myId, nextColor]);

  // Axis labels: reverse order for black perspective like chess
  const colLabels = useMemo(() => {
    const base = COLUMN_LABELS.slice();
    return myAssignedColor === 'white' ? base.reverse() : base;
  }, [myAssignedColor]);

  const rowLabels = useMemo(() => {
    const base = ROW_LABELS.slice();
    return myAssignedColor === 'white' ? base.reverse() : base;
  }, [myAssignedColor]);

  const isMyTurn =
    Boolean(interactable && spoilerOff && loaded) &&
    !pendingMove &&
    myAssignedColor === nextColor;

  const lastCommittedMove = initialState?.move || null;
  const lastMovePosition = newOmokState?.move?.position
    ? newOmokState.move.position
    : pendingMove
    ? pendingMove.position
    : initialState?.move?.position || null;
  const displayedMove =
    newOmokState?.move || pendingMove?.move || lastCommittedMove;
  const displayedColor =
    pendingMove?.position.color ||
    (displayedMove?.by != null
      ? playerColors[displayedMove.by as number]
      : undefined);
  // moved below userMadeLastMove declaration to avoid TDZ
  const winnerId = initialState?.winnerId || gameWinnerId;
  const userMadeLastMove = displayedMove?.by === myId;

  // For message context, mirror Chess: rely solely on spoilerOff to decide reveal
  const boardVisible = !!spoilerOff;

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
    if (!boardVisible) {
      handleSpoilerToggle();
      return;
    }
    if (!isMyTurn) return;
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

    const nextState = {
      board: boardAfterMove,
      move,
      playerColors: updatedColors,
      ...(winning ? { winnerId: myId } : {})
    };
    if (onSetNewOmokState) {
      onSetNewOmokState(nextState);
    } else {
      setPendingMove({
        board: boardAfterMove,
        move,
        playerColors: updatedColors,
        isWinning: winning,
        position: { row, col, color: myAssignedColor }
      });
    }
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

  const awaitingMoveLabel = useMemo(() => {
    if (isMyTurn) {
      return (
        <>
          <p>Your move</p>
        </>
      );
    }
    return (
      <>
        <p>Awaiting</p>
        <p>{`${opponentName || 'opponent'}'s move`}</p>
      </>
    );
  }, [isMyTurn, opponentName]);

  const statusMsgShown = useMemo(() => {
    const isCountdownShown = typeof countdownNumber === 'number';
    if (isCountdownShown) {
      return true;
    }
    const isLastOmokMessage =
      lastOmokMessageId && (messageId || 0) >= lastOmokMessageId;
    const shouldHideStatus = !!winnerId || !loaded;
    if (shouldHideStatus) {
      return false;
    }
    return Boolean(isLastOmokMessage && userMadeLastMove);
  }, [
    countdownNumber,
    lastOmokMessageId,
    messageId,
    winnerId,
    loaded,
    userMadeLastMove
  ]);

  const gameStatusMessageShown = useMemo(() => {
    return (
      loaded &&
      (boardVisible ||
        !!pendingMove ||
        !!winnerId ||
        !!displayedMove?.number ||
        !!moveViewed)
    );
  }, [
    boardVisible,
    displayedMove?.number,
    loaded,
    moveViewed,
    pendingMove,
    winnerId
  ]);

  const countdownDisplay =
    typeof countdownNumber === 'number'
      ? countdownNumber >= 110
        ? `${Math.floor(countdownNumber / 600)}:${String(
            Math.floor((countdownNumber % 600) / 10)
          ).padStart(2, '0')}`
        : Number((countdownNumber % 600) / 10).toFixed(1)
      : null;

  const hasTopInfo = useMemo(() => {
    return Boolean(
      displayedMove?.number ||
        (boardVisible && displayedMove && lastMovePosition) ||
        pendingMove?.isWinning ||
        winnerId
    );
  }, [
    boardVisible,
    displayedMove,
    lastMovePosition,
    pendingMove?.isWinning,
    winnerId
  ]);

  return (
    <div className={containerClass} style={{ ...style }}>
      {gameStatusMessageShown && hasTopInfo && (
        <div className={topInfoClass}>
          {displayedMove?.number && (
            <span>
              Move <b>{displayedMove.number}</b>:
            </span>
          )}
          {boardVisible && displayedMove && lastMovePosition && (
            <span>
              {pendingMove
                ? 'Pending move'
                : displayedMove.by === myId
                ? 'You'
                : displayedMove.by === opponentId
                ? opponentName || 'Opponent'
                : 'Opponent'}{' '}
              {pendingMove ? 'placing' : 'placed'} a{' '}
              <b>
                {displayedColor ||
                  (displayedMove.number % 2 === 1 ? 'black' : 'white')}
              </b>{' '}
              stone at{' '}
              <b>{`${colLabels[lastMovePosition.col]}${
                rowLabels[lastMovePosition.row]
              }`}</b>
            </span>
          )}
          {pendingMove?.isWinning && (
            <span>
              <b>Five in a row!</b> Confirm to seal the win.
            </span>
          )}
          {winnerId && (
            <span>
              {winnerId === myId
                ? 'You won the omok match'
                : winnerId === opponentId
                ? `${opponentName || 'Opponent'} won the omok match`
                : 'Omok match finished'}
            </span>
          )}
        </div>
      )}
      <div className={boardShellClass}>
        <div className={topSpacerClass} />
        {boardVisible ? (
          <div className={alignGridClass} style={boardSizeStyle}>
            {/* Row labels in first column */}
            {rowLabels.map((label, r) => (
              <div
                key={`r-${r}`}
                className={rowLabelClass}
                style={{ gridColumn: 1, gridRow: r + 1 }}
              >
                {label}
              </div>
            ))}

            {/* Board plane spans only the board cells (columns 2.., rows 1..BOARD_SIZE) */}
            <div
              className={boardPlaneClass}
              style={{
                gridColumn: `2 / span ${BOARD_SIZE}`,
                gridRow: `1 / span ${BOARD_SIZE}`
              }}
              onClick={() => {
                if (!interactable && onBoardClick) onBoardClick();
              }}
            >
              <div className={cellsGridClass}>
                {Array.from({ length: BOARD_SIZE }).map((_, row) =>
                  Array.from({ length: BOARD_SIZE }).map((__, col) => {
                    const cell = boardToRender[row][col];
                    const isLastMove =
                      lastMovePosition &&
                      lastMovePosition.row === row &&
                      lastMovePosition.col === col;
                    return (
                      <OmokCell
                        key={`${row}-${col}`}
                        value={cell}
                        isLastMove={isLastMove}
                        canInteract={Boolean(isMyTurn && !cell && !pendingMove)}
                        onClick={() => handleCellClick(row, col)}
                      />
                    );
                  })
                )}
              </div>
            </div>

            {/* Column labels along the bottom row */}
            {colLabels.map((label, c) => (
              <div
                key={`c-${c}`}
                className={colLabelClass}
                style={{ gridColumn: c + 2, gridRow: BOARD_SIZE + 1 }}
              >
                {label}
              </div>
            ))}
          </div>
        ) : (
          <div className={hiddenBoardWrapperClass} style={boardSizeStyle}>
            <div className={hiddenBoardClass} onClick={handleSpoilerToggle}>
              <Icon icon="eye-slash" />
              <div>
                <p>
                  {opponentName
                    ? `${opponentName} made a new omok move.`
                    : 'New omok move available.'}
                </p>
                <p>Tap to reveal the board.</p>
                <p>
                  After viewing the move, you <b>must</b> respond within your
                  timer or lose.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className={bottomSpacerClass}>
          {interactable && !onSetNewOmokState && pendingMove && (
            <div className={pendingButtonsClass}>
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
          {interactable && !pendingMove && boardVisible && isMyTurn && (
            <div className={instructionsClass}>
              {'Select an empty intersection to place your stone.'}
            </div>
          )}
          {/* Removed hint below board to match Chess UI */}
          {errorMessage && (
            <div className={errorOverlayClass}>
              <Icon icon="triangle-exclamation" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
      {winnerId && (
        <div style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}>
          <div
            className={resultOverlayClass}
            style={{
              background:
                winnerId === myId
                  ? Color.gold(0.9)
                  : winnerId === opponentId
                  ? Color.black(0.8)
                  : Color.logoBlue(0.8)
            }}
          >
            {winnerId === myId ? (
              <>
                <p>Five in a row!</p>
                <p>You win</p>
              </>
            ) : winnerId === opponentId ? (
              <>
                <p>Five in a row...</p>
                <p>{opponentName || 'Opponent'} wins</p>
              </>
            ) : (
              <p>Omok match finished</p>
            )}
          </div>
        </div>
      )}
      {statusMsgShown && (
        <div
          className={statusOverlayClass}
          style={{
            fontSize:
              typeof countdownNumber === 'number' && countdownNumber < 110
                ? '3.5rem'
                : undefined,
            color:
              typeof countdownNumber === 'number' && countdownNumber < 110
                ? 'red'
                : undefined
          }}
        >
          {countdownDisplay || awaitingMoveLabel}
        </div>
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
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!canInteract) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <div
      role={canInteract ? 'button' : 'presentation'}
      tabIndex={canInteract ? 0 : -1}
      className={omokCellClass}
      style={{ cursor: canInteract ? 'pointer' : 'default' }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {value === 'black' && (
        <div
          className={stoneBaseClass}
          style={{
            background: Color.black(),
            border: `1px solid ${Color.black(0.6)}`,
            // stronger yellow glow for black stone
            boxShadow: `0 0.6rem 1.6rem rgba(0,0,0,0.25)${
              isLastMove
                ? ', 0 0 1rem rgba(255,215,0,0.85), 0 0 2.2rem rgba(255,215,0,0.6)'
                : ''
            }`
          }}
        />
      )}
      {value === 'white' && (
        <div
          className={stoneBaseClass}
          style={{
            background: Color.white(),
            border: `1px solid ${Color.black(0.2)}`,
            // stronger orange glow for white stone
            boxShadow: `0 0.6rem 1.6rem rgba(0,0,0,0.25)${
              isLastMove
                ? ', 0 0 1rem rgba(255,140,0,0.9), 0 0 2rem rgba(255,140,0,0.6)'
                : ''
            }`
          }}
        />
      )}
    </div>
  );
}

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
