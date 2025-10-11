import React, { useEffect, useMemo, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import BoardWrapper from '../BoardWrapper';
import Game from './Game';
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
  createsOverline,
  isWinningMove,
  normaliseBoard,
  getWinningLine
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
  countdownNumber?: number | null;
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
  // modal context hint for status visibility parity with chess
  isFromModal?: boolean;
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
  loaded,
  lastOmokMessageId,
  onBoardClick,
  onSpoilerClick,
  onConfirmMove,
  onCancelPendingMove,
  style,
  newOmokState,
  onSetNewOmokState,
  isFromModal
}: OmokProps) {
  const boardSize = useMemo(() => {
    if (isFromModal) {
      return deviceIsMobile ? 'min(78vw, 40vh)' : 'min(50vh, 60vw)';
    }
    return deviceIsMobile ? 'min(65vw, 38vh)' : 'min(60vh, 60vw)';
  }, [isFromModal]);
  const boardSizeStyle = useMemo(
    () =>
      ({
        '--omok-board-size': boardSize,
        width: 'calc(var(--omok-board-size) + 2rem)',
        height: 'calc(var(--omok-board-size) + 2rem)'
      } as React.CSSProperties),
    [boardSize]
  );

  const baseBoard = useMemo(
    () =>
      initialState ? normaliseBoard(initialState.board) : createEmptyBoard(),
    [initialState]
  );

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
  const stonesPlaced = countPlaced(boardToRender);
  const nextColor: OmokColor = stonesPlaced % 2 === 0 ? 'black' : 'white';

  // Determine effective assigned colors, preferring in-flight state
  const effectivePlayerColors: PlayerColors = useMemo(() => {
    return (
      pendingMove?.playerColors || newOmokState?.playerColors || playerColors
    );
  }, [pendingMove?.playerColors, newOmokState?.playerColors, playerColors]);

  // Fallback assignment should be based on the base board (not pending)
  const baseStones = useMemo(() => countPlaced(baseBoard), [baseBoard]);
  const initialNextColor: OmokColor = baseStones % 2 === 0 ? 'black' : 'white';

  const myAssignedColor: OmokColor = useMemo(() => {
    if (effectivePlayerColors[myId]) return effectivePlayerColors[myId];
    return initialNextColor;
  }, [effectivePlayerColors, myId, initialNextColor]);

  const colLabels = useMemo(() => {
    const base = COLUMN_LABELS.slice();
    return myAssignedColor === 'white' ? base.reverse() : base;
  }, [myAssignedColor]);

  const rowLabels = useMemo(() => {
    const base = ROW_LABELS.slice();
    return myAssignedColor === 'white' ? base.reverse() : base;
  }, [myAssignedColor]);

  const isMyTurn =
    Boolean(interactable && loaded && (spoilerOff || stonesPlaced === 0)) &&
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

  // Show board on: game over, spoiler off, brand-new board, while placing a move, or after my move
  const boardVisible =
    !!winnerId ||
    !!spoilerOff ||
    stonesPlaced === 0 ||
    !!pendingMove ||
    displayedMove?.by === myId;
  const boardIsLoading = loaded === false;

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
    if (boardToRender[row][col]) {
      setErrorMessage('That intersection is already taken.');
      return;
    }

    const updatedColors = ensurePlayerColors();

    const moveNumber = countPlaced(boardToRender) + 1;
    const move: OmokMove = {
      number: moveNumber,
      by: myId,
      position: { row, col }
    };

    const boardBeforeMove = cloneBoard(boardToRender);
    // Double-three rule: apply only for black
    if (
      myAssignedColor === 'black' &&
      createsDoubleThree({
        board: boardBeforeMove,
        move,
        color: myAssignedColor
      })
    ) {
      setErrorMessage('Double-three is not allowed.');
      return;
    }

    const boardAfterMove = cloneBoard(boardToRender);
    boardAfterMove[row][col] = myAssignedColor;
    if (
      myAssignedColor === 'black' &&
      createsOverline({
        board: boardAfterMove,
        move,
        color: myAssignedColor
      })
    ) {
      setErrorMessage('Overlines are not allowed for black.');
      return;
    }
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

  const statusMsgShown = useMemo(() => {
    const isCountdownShown = typeof countdownNumber === 'number';
    if (isCountdownShown) return true;
    const isLastOmokMessage =
      lastOmokMessageId && (messageId || 0) >= lastOmokMessageId;
    const shouldHideStatus = !!winnerId || !!moveViewed;
    const isActiveGame =
      (Boolean(isLastOmokMessage) || Boolean(isFromModal)) &&
      !shouldHideStatus &&
      !!loaded &&
      !!userMadeLastMove;
    return isActiveGame;
  }, [
    countdownNumber,
    isFromModal,
    lastOmokMessageId,
    loaded,
    messageId,
    moveViewed,
    userMadeLastMove,
    winnerId
  ]);

  const gameStatusMessageShown = useMemo(() => {
    const userMade = displayedMove?.by === myId;
    return (
      loaded && (boardVisible || !!pendingMove || !!winnerId || !!userMade)
    );
  }, [boardVisible, displayedMove?.by, loaded, myId, pendingMove, winnerId]);

  const hasTopInfo = useMemo(() => {
    const moveNum = displayedMove?.number;
    const userMade = displayedMove?.by === myId;
    return Boolean(
      (boardVisible && moveNum) ||
        (userMade && moveNum) ||
        (boardVisible && displayedMove && lastMovePosition) ||
        pendingMove?.isWinning ||
        winnerId
    );
  }, [
    boardVisible,
    displayedMove,
    lastMovePosition,
    myId,
    pendingMove?.isWinning,
    winnerId
  ]);

  const topInfoShown = useMemo(
    () => gameStatusMessageShown && hasTopInfo,
    [gameStatusMessageShown, hasTopInfo]
  );

  // Compute winning line (for pending or committed wins)
  const winningLine = useMemo(() => {
    if (pendingMove?.isWinning) {
      return (
        getWinningLine({
          board: boardToRender,
          lastMove: pendingMove.position,
          color: pendingMove.position.color
        }) || []
      );
    }
    if (winnerId) {
      const winColor = Object.entries(playerColors).find(
        ([uid]) => Number(uid) === Number(winnerId)
      )?.[1] as OmokColor | undefined;
      return (
        getWinningLine({
          board: boardToRender,
          lastMove: lastMovePosition || undefined,
          color: winColor
        }) || []
      );
    }
    return [];
  }, [
    boardToRender,
    lastMovePosition,
    pendingMove?.isWinning,
    pendingMove?.position,
    playerColors,
    winnerId
  ]);

  const winningMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const cell of winningLine as Array<{ row: number; col: number }>) {
      map[`${cell.row}-${cell.col}`] = true;
    }
    return map;
  }, [winningLine]);
  const lastMoveCoordinates = useMemo(
    () =>
      lastMovePosition
        ? { row: lastMovePosition.row, col: lastMovePosition.col }
        : null,
    [lastMovePosition]
  );

  return (
    <div className={containerClass} style={{ ...style }}>
      <BoardWrapper
        style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
        timerPlacement={isFromModal ? 'overlay' : 'inline'}
        statusShown={topInfoShown}
        gameInfo={{
          type: 'omok',
          moveNumber: displayedMove?.number,
          actorLabel: pendingMove
            ? 'Pending move'
            : displayedMove?.by === myId
            ? 'You'
            : displayedMove?.by === opponentId
            ? opponentName || 'Opponent'
            : 'Opponent',
          color: (displayedColor ||
            (displayedMove?.number && displayedMove.number % 2 === 1
              ? 'black'
              : 'white')) as 'black' | 'white',
          positionLabel:
            boardVisible && lastMovePosition
              ? (() => {
                  const dispColIdx =
                    myAssignedColor === 'white'
                      ? BOARD_SIZE - 1 - lastMovePosition.col
                      : lastMovePosition.col;
                  const dispRowIdx =
                    myAssignedColor === 'white'
                      ? BOARD_SIZE - 1 - lastMovePosition.row
                      : lastMovePosition.row;
                  return `${colLabels[dispColIdx]}${rowLabels[dispRowIdx]}`;
                })()
              : undefined,
          pendingIsWinning: !!pendingMove?.isWinning,
          winner: winnerId ? (winnerId === myId ? 'you' : 'opponent') : null,
          boardShown: boardVisible
        }}
        timerData={{
          shown: statusMsgShown,
          countdownNumber:
            typeof countdownNumber === 'number' ? countdownNumber : null,
          awaitingOpponentName: opponentName,
          showAwaitingStatus: !isFromModal
        }}
        afterBoard={
          <>
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
            {errorMessage && (
              <div className={errorOverlayClass}>
                <Icon icon="triangle-exclamation" />
                <span>{errorMessage}</span>
              </div>
            )}
          </>
        }
      >
        <Game
          boardSizeStyle={boardSizeStyle}
          boardVisible={boardVisible}
          colLabels={colLabels}
          interactable={interactable}
          isMyTurn={isMyTurn}
          hasPendingMove={Boolean(pendingMove)}
          lastMovePosition={lastMoveCoordinates}
          loading={boardIsLoading}
          myAssignedColor={myAssignedColor}
          onBoardClick={onBoardClick}
          onCellClick={handleCellClick}
          onReveal={handleSpoilerToggle}
          opponentName={opponentName}
          rowLabels={rowLabels}
          winningMap={winningMap}
          boardToRender={boardToRender}
        />
      </BoardWrapper>
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
                <p>五目!</p>
                <p>You win</p>
              </>
            ) : winnerId === opponentId ? (
              <>
                <p>五目...</p>
                <p>{opponentName || 'Opponent'} wins</p>
              </>
            ) : (
              <p>Omok match finished</p>
            )}
          </div>
        </div>
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
