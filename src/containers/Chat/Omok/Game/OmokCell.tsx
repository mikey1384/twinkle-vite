import React, { memo } from 'react';
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
  label: string;
  navigationIndex?: number;
  tabIndex?: number;
  onFocus?: () => void;
  value: OmokCellType;
  isLastMove: boolean;
  isWinCell?: boolean;
  canInteract: boolean;
  onClick: () => void;
}

function OmokCell({
  label,
  navigationIndex,
  tabIndex,
  onFocus,
  value,
  isLastMove,
  isWinCell,
  canInteract,
  onClick
}: CellProps) {
  const Element = canInteract ? 'button' : 'div';

  return (
    <Element
      type={canInteract ? 'button' : undefined}
      role={canInteract ? undefined : 'img'}
      aria-label={label}
      data-omok-index={navigationIndex}
      tabIndex={tabIndex}
      onFocus={onFocus}
      className={css`
        width: 100%;
        height: 100%;
        position: relative;
        min-width: 0;
        padding: 0;
        border: 0;
        appearance: none;
        &:focus-visible { outline: 2px solid #334155; outline-offset: -2px; z-index: 1; }
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
      onClick={onClick}
    >
      {value === 'black' && (
        <span
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
        <span
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
    </Element>
  );
}

export default memo(OmokCell);
