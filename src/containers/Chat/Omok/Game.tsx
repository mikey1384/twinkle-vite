import React from 'react';
import Loading from '~/components/Loading';
import BoardSpoiler from '~/containers/Chat/BoardSpoiler';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { BOARD_SIZE, OmokCell as OmokCellType, OmokColor } from './helpers';

interface GameProps {
  boardSizeStyle: React.CSSProperties;
  boardVisible: boolean;
  colLabels: string[];
  interactable?: boolean;
  isMyTurn: boolean;
  hasPendingMove: boolean;
  lastMovePosition: { row: number; col: number } | null;
  loading: boolean;
  myAssignedColor: OmokColor;
  onBoardClick?: () => void;
  onCellClick: (row: number, col: number) => void;
  onReveal: () => void;
  opponentName?: string;
  rowLabels: (number | string)[];
  winningMap: Record<string, boolean>;
  boardToRender: OmokCellType[][];
}

export default function Game({
  boardSizeStyle,
  boardVisible,
  colLabels,
  interactable,
  isMyTurn,
  hasPendingMove,
  lastMovePosition,
  loading,
  myAssignedColor,
  onBoardClick,
  onCellClick,
  onReveal,
  opponentName,
  rowLabels,
  winningMap,
  boardToRender
}: GameProps) {
  if (loading) {
    return (
      <div className={loadingContainerClass} style={boardSizeStyle}>
        <Loading />
      </div>
    );
  }

  return (
    <BoardSpoiler
      revealed={boardVisible}
      onReveal={onReveal}
      style={boardSizeStyle}
      gameType="omok"
      opponentName={opponentName}
    >
      <div className={alignGridClass}>
        {rowLabels.map((label, r) => (
          <div
            key={`r-${r}`}
            className={rowLabelClass}
            style={{ gridColumn: 1, gridRow: r + 1 }}
          >
            {label}
          </div>
        ))}

        <div
          className={boardPlaneClass}
          style={{
            gridColumn: `2 / span ${BOARD_SIZE}`,
            gridRow: `1 / span ${BOARD_SIZE}`,
            cursor: !interactable && onBoardClick ? 'pointer' : 'default'
          }}
          onClick={() => {
            if (!interactable && onBoardClick) onBoardClick();
          }}
        >
          <div
            className={cellsGridClass}
            style={{
              cursor: !interactable && onBoardClick ? 'pointer' : undefined
            }}
          >
            {Array.from({ length: BOARD_SIZE }).map((_, displayRow) =>
              Array.from({ length: BOARD_SIZE }).map((__, displayCol) => {
                const sourceRow =
                  myAssignedColor === 'white'
                    ? BOARD_SIZE - 1 - displayRow
                    : displayRow;
                const sourceCol =
                  myAssignedColor === 'white'
                    ? BOARD_SIZE - 1 - displayCol
                    : displayCol;
                const cell = boardToRender[sourceRow][sourceCol];
                const isLastMove =
                  !!lastMovePosition &&
                  lastMovePosition.row === sourceRow &&
                  lastMovePosition.col === sourceCol;
                const isWinCell = Boolean(
                  winningMap[`${sourceRow}-${sourceCol}`]
                );
                return (
                  <OmokCell
                    key={`${sourceRow}-${sourceCol}`}
                    value={cell}
                    isLastMove={isLastMove}
                    isWinCell={isWinCell}
                    canInteract={Boolean(isMyTurn && !cell && !hasPendingMove)}
                    onClick={() => onCellClick(sourceRow, sourceCol)}
                  />
                );
              })
            )}
          </div>
        </div>

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
    </BoardSpoiler>
  );
}

const loadingContainerClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Color.white(0.95)};
  border: 1px solid ${Color.borderGray()};
  border-radius: ${borderRadius};
  box-shadow: 0 0.5rem 2rem ${Color.black(0.08)};
`;

const alignGridClass = css`
  display: grid;
  grid-template-columns: 2rem repeat(${BOARD_SIZE}, 1fr);
  grid-template-rows: repeat(${BOARD_SIZE}, 1fr) 2rem;
  align-items: stretch;
  justify-items: stretch;
  background: ${Color.white(0.95)};
  border: 1px solid ${Color.borderGray()};
  border-radius: ${borderRadius};
  box-shadow: 0 0.5rem 2rem ${Color.black(0.08)};
  position: relative;
  width: calc(var(--omok-board-size) + 2rem);
  height: calc(var(--omok-board-size) + 2rem);
  transition: box-shadow 0.3s ease;
  font: 14px 'Century Gothic', Futura, sans-serif;
  aspect-ratio: 1 / 1;
  box-sizing: border-box;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1.25rem repeat(${BOARD_SIZE}, 1fr);
    grid-template-rows: repeat(${BOARD_SIZE}, 1fr) 1.25rem;
    width: calc(var(--omok-board-size) + 1.25rem);
    height: calc(var(--omok-board-size) + 1.25rem);
  }
`;

const rowLabelClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${Color.darkGray()};
  font-weight: bold;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.9rem;
  }
`;

const colLabelClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${Color.darkGray()};
  font-weight: bold;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 0.9rem;
  }
`;

const boardPlaneClass = css`
  position: relative;
  border-radius: 0;
  border-top-right-radius: ${borderRadius};
  box-shadow: inset 0 0 0 2px ${Color.lightBrown()};
  box-sizing: border-box;
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

interface CellProps {
  value: OmokCellType;
  isLastMove: boolean;
  isWinCell?: boolean;
  canInteract: boolean;
  onClick: () => void;
}

function OmokCell({
  value,
  isLastMove,
  isWinCell,
  canInteract,
  onClick
}: CellProps) {
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
      style={{ cursor: canInteract ? 'pointer' : undefined }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {value === 'black' && (
        <div
          className={stoneBaseClass}
          style={{
            background: Color.black(),
            border: `1px solid ${Color.black(0.6)}`,
            boxShadow: `0 0.6rem 1.6rem rgba(0,0,0,0.2)${
              isWinCell
                ? ', 0 0 0.8rem rgba(255,215,0,0.9), 0 0 2.4rem rgba(255,215,0,0.6)'
                : isLastMove
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
            boxShadow: `0 0.6rem 1.6rem rgba(0,0,0,0.2)${
              isWinCell
                ? ', 0 0 0.8rem rgba(255,140,0,0.95), 0 0 2.4rem rgba(255,140,0,0.6)'
                : isLastMove
                ? ', 0 0 1rem rgba(255,140,0,0.9), 0 0 2rem rgba(255,140,0,0.6)'
                : ''
            }`
          }}
        />
      )}
    </div>
  );
}

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
  height: auto;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.2);
`;
