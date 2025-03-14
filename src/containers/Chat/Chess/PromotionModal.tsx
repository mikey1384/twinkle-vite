// PromotionModal.js
import React from 'react';
import Modal from '~/components/Modal';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function PromotionModal({
  onHide,
  onPromote
}: {
  onHide: () => void;
  onPromote: (piece: string) => void;
}) {
  const pieceChoices = ['queen', 'rook', 'bishop', 'knight'];

  return (
    <Modal modalOverModal onHide={onHide} closeWhenClickedOutside={false}>
      <header>Promote Pawn</header>
      <main
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
        `}
      >
        <p>Choose which piece to promote to:</p>
        <div
          className={css`
            display: flex;
            margin-top: 1rem;
            justify-content: center;
            gap: 1rem;
          `}
        >
          {pieceChoices.map((piece) => (
            <button
              key={piece}
              className={css`
                cursor: pointer;
                padding: 0.5rem 1rem;
                border: 1px solid ${Color.darkGray()};
                background: ${Color.logoBlue()};
                color: #fff;
                border-radius: 4px;
                &:hover {
                  opacity: 0.8;
                }
              `}
              onClick={() => onPromote(piece)}
            >
              {piece.toUpperCase()}
            </button>
          ))}
        </div>
      </main>
      <footer
        className={css`
          display: flex;
          justify-content: flex-end;
        `}
      >
        <button
          onClick={onHide}
          className={css`
            cursor: pointer;
            border: none;
            background: ${Color.gray()};
            color: #fff;
            border-radius: 4px;
            padding: 0.5rem 1rem;
            &:hover {
              opacity: 0.8;
            }
          `}
        >
          Cancel
        </button>
      </footer>
    </Modal>
  );
}
