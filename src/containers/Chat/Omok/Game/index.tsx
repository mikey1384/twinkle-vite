import React, { memo, useEffect, useRef, useState } from 'react';
import Loading from '~/components/Loading';
import BoardSpoiler from '../../BoardSpoiler';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { BOARD_SIZE, OmokCell as OmokCellType, OmokColor } from '../helpers';
import OmokCell from './OmokCell';

const loadingContainerClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Color.white(0.95)};
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  box-shadow: 0 0.5rem 2rem ${Color.black(0.08)};
`;

const alignGridClass = css`
  display: grid;
  grid-template-columns: var(--omok-axis-size, 2rem) repeat(${BOARD_SIZE}, minmax(0, 1fr));
  grid-template-rows: repeat(${BOARD_SIZE}, minmax(0, 1fr)) var(--omok-axis-size, 2rem);
  align-items: stretch;
  justify-items: stretch;
  background: ${Color.white(0.95)};
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  box-shadow: 0 0.5rem 2rem ${Color.black(0.08)};
  position: relative;
  width: calc(var(--omok-board-size) + var(--omok-axis-size, 2rem));
  height: calc(var(--omok-board-size) + var(--omok-axis-size, 2rem));
  transition: box-shadow 0.3s ease;
  font: 14px 'Century Gothic', Futura, sans-serif;
  box-sizing: border-box;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: var(--omok-axis-size, 1.25rem) repeat(${BOARD_SIZE}, minmax(0, 1fr));
    grid-template-rows: repeat(${BOARD_SIZE}, minmax(0, 1fr)) var(--omok-axis-size, 1.25rem);
    width: calc(var(--omok-board-size) + var(--omok-axis-size, 1.25rem));
    height: calc(var(--omok-board-size) + var(--omok-axis-size, 1.25rem));
  }
`;

const rowLabelClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${Color.darkGray()};
  font-weight: bold;
  min-height: 0;
  overflow: hidden;
  font-size: 10px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
`;

const colLabelClass = css`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${Color.darkGray()};
  font-weight: bold;
  min-width: 0;
  overflow: hidden;
  font-size: 10px;
  line-height: 1;
`;

const boardPlaneClass = css`
  position: relative;
  border-radius: 0;
  border-top-right-radius: ${borderRadius};
  box-shadow: inset 0 0 0 2px ${Color.lightBrown()};
  box-sizing: border-box;
  touch-action: manipulation;
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
  touch-action: manipulation;
`;

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

function Game({
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
  const [activeCell, setActiveCell] = useState(Math.floor(BOARD_SIZE * BOARD_SIZE / 2));
  const gridRef = useRef<HTMLDivElement>(null);
  const wasVisible = useRef(boardVisible);
  useEffect(() => {
    const revealed = boardVisible && !wasVisible.current;
    wasVisible.current = boardVisible;
    const grid = gridRef.current;
    if (!revealed || !grid) return;
    const doc = grid.ownerDocument;
    if (doc.activeElement === doc.body || doc.activeElement === doc.documentElement) {
      grid.querySelector<HTMLElement>('[data-omok-index][tabindex="0"]')?.focus({ preventScroll: true });
    }
  }, [boardVisible]);

  function handleGridKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.metaKey || event.nativeEvent.isComposing) return;
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-omok-index]');
    if (!target || !event.currentTarget.contains(target)) return;
    const index = Number(target.dataset.omokIndex);
    if (!Number.isInteger(index) || index < 0 || index >= BOARD_SIZE * BOARD_SIZE) return;
    const row = Math.floor(index / BOARD_SIZE), col = index % BOARD_SIZE;
    let next = index;
    switch (event.key) {
      case 'ArrowLeft': next = row * BOARD_SIZE + Math.max(0, col - 1); break;
      case 'ArrowRight': next = row * BOARD_SIZE + Math.min(BOARD_SIZE - 1, col + 1); break;
      case 'ArrowUp': next = Math.max(0, row - 1) * BOARD_SIZE + col; break;
      case 'ArrowDown': next = Math.min(BOARD_SIZE - 1, row + 1) * BOARD_SIZE + col; break;
      case 'Home': next = event.ctrlKey ? 0 : row * BOARD_SIZE; break;
      case 'End': next = event.ctrlKey ? BOARD_SIZE * BOARD_SIZE - 1 : (row + 1) * BOARD_SIZE - 1; break;
      default: return;
    }
    event.preventDefault();
    event.stopPropagation();
    setActiveCell(next);
    event.currentTarget.querySelector<HTMLElement>(`[data-omok-index="${next}"]`)?.focus({ preventScroll: true });
  }

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
            ref={gridRef}
            role="group"
            aria-label="Omok board. Use arrow keys to explore intersections; Enter or Space selects an empty intersection on your turn."
            onKeyDown={handleGridKeyDown}
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
                    label={`${colLabels[displayCol]}${rowLabels[displayRow]}, ${cell || 'empty'}${isLastMove ? ', last move' : ''}${isWinCell ? ', winning line' : ''}`}
                    navigationIndex={displayRow * BOARD_SIZE + displayCol}
                    tabIndex={activeCell === displayRow * BOARD_SIZE + displayCol ? 0 : -1}
                    onFocus={() => setActiveCell(displayRow * BOARD_SIZE + displayCol)}
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

export default memo(Game);
