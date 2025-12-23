import React from 'react';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { OmokCell as OmokCellType } from '../helpers';

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

interface CellProps {
  value: OmokCellType;
  isLastMove: boolean;
  isWinCell?: boolean;
  canInteract: boolean;
  onClick: () => void;
}

export default function OmokCell({
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
      className={css`
        width: 100%;
        height: 100%;
        position: relative;
        touch-action: manipulation;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        background: linear-gradient(
          135deg,
          rgba(222, 184, 135, 0.65),
          rgba(245, 222, 179, 0.78)
        );
        transition: background 0.2s ease, transform 0.15s ease;
        @media (hover: hover) and (pointer: fine) {
          &:hover {
            transform: translateZ(0);
          }
        }
      `}
      style={{ cursor: canInteract ? 'pointer' : undefined }}
      onPointerDown={(e) => {
        if (canInteract && e.pointerType !== 'mouse') {
          e.preventDefault();
          onClick();
        }
      }}
      onClick={(e) => {
        if ((e.nativeEvent as PointerEvent).pointerType !== 'touch') {
          onClick();
        }
      }}
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
                ? ', 0 0 0 5px rgba(255,215,0,0.98), 0 0 1.5rem rgba(255,215,0,0.95), 0 0 3rem rgba(255,215,0,0.75)'
                : isLastMove
                ? ', 0 0 0 3px rgba(255,140,0,0.9), 0 0 1.2rem rgba(255,140,0,0.95), 0 0 2.4rem rgba(255,140,0,0.7)'
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
                ? ', 0 0 0 5px rgba(255,215,0,0.98), 0 0 1.5rem rgba(255,215,0,0.95), 0 0 3rem rgba(255,215,0,0.75)'
                : isLastMove
                ? ', 0 0 0 3px rgba(255,140,0,0.9), 0 0 1.2rem rgba(255,140,0,0.95), 0 0 2.4rem rgba(255,140,0,0.7)'
                : ''
            }`
          }}
        />
      )}
    </div>
  );
}
