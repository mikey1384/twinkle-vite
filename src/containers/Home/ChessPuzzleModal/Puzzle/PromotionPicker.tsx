import React from 'react';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import {
  surface,
  borderSubtle,
  shadowButton,
  shadowButtonHover,
  radiusCard,
  radiusButton
} from './styles';

interface PromotionPickerProps {
  color: 'white' | 'black';
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
}

export default function PromotionPicker({
  color,
  onSelect,
  onCancel
}: PromotionPickerProps) {
  const pieceImages = {
    white: {
      q: `${cloudFrontURL}/assets/chess/WhiteQueen.svg`,
      r: `${cloudFrontURL}/assets/chess/WhiteRook.svg`,
      b: `${cloudFrontURL}/assets/chess/WhiteBishop.svg`,
      n: `${cloudFrontURL}/assets/chess/WhiteKnight.svg`
    },
    black: {
      q: `${cloudFrontURL}/assets/chess/BlackQueen.svg`,
      r: `${cloudFrontURL}/assets/chess/BlackRook.svg`,
      b: `${cloudFrontURL}/assets/chess/BlackBishop.svg`,
      n: `${cloudFrontURL}/assets/chess/BlackKnight.svg`
    }
  };

  const pieceNames = {
    q: 'Queen',
    r: 'Rook',
    b: 'Bishop',
    n: 'Knight'
  };

  return (
    <div
      className={css`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease-out;

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}
    >
      <div
        className={css`
          background: ${surface};
          border: 1px solid ${borderSubtle};
          border-radius: ${radiusCard};
          padding: 2.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          text-align: center;
          max-width: 360px;
          width: 90%;
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      >
        <h3
          className={css`
            margin: 0 0 2rem 0;
            color: #222222;
            font-size: 1.5rem;
            font-weight: 600;
            letter-spacing: -0.01em;
          `}
        >
          Choose promotion piece
        </h3>

        <div
          className={css`
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 2rem;
          `}
        >
          {(['q', 'r', 'b', 'n'] as const).map((piece) => (
            <button
              key={piece}
              onClick={() => onSelect(piece)}
              className={css`
                background: ${surface};
                border: 1px solid ${borderSubtle};
                border-radius: ${radiusButton};
                padding: 1.25rem;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: ${shadowButton};
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.75rem;

                &:hover {
                  background: ${surface};
                  border-color: #222222;
                  transform: translateY(-2px);
                  box-shadow: ${shadowButtonHover};
                }

                &:active {
                  transform: translateY(0);
                  box-shadow: ${shadowButton};
                }
              `}
            >
              <img
                src={pieceImages[color][piece]}
                alt={pieceNames[piece]}
                className={css`
                  width: 48px;
                  height: 48px;
                  transition: transform 0.2s ease;

                  button:hover & {
                    transform: scale(1.05);
                  }
                `}
              />
              <span
                className={css`
                  font-size: 1rem;
                  font-weight: 600;
                  color: #222222;
                  letter-spacing: -0.01em;
                `}
              >
                {pieceNames[piece]}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className={css`
            width: 100%;
            background: ${surface};
            border: 1px solid ${borderSubtle};
            border-radius: ${radiusButton};
            padding: 0.875rem 1.25rem;
            font-size: 1rem;
            font-weight: 600;
            color: #222222;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: ${shadowButton};

            &:hover {
              background: ${surface};
              border-color: #222222;
              box-shadow: ${shadowButtonHover};
              transform: translateY(-1px);
            }

            &:active {
              transform: translateY(0);
              box-shadow: ${shadowButton};
            }
          `}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
