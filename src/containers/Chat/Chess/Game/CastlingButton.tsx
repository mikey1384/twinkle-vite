import React from 'react';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Color, tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

const BlackRook = `${cloudFrontURL}/assets/chess/BlackRook.svg`;
const BlackKing = `${cloudFrontURL}/assets/chess/BlackKing.svg`;

const WhiteRook = `${cloudFrontURL}/assets/chess/WhiteRook.svg`;
const WhiteKing = `${cloudFrontURL}/assets/chess/WhiteKing.svg`;


export default function CastlingButton({
  interactable,
  myColor,
  onCastling,
  squares
}: {
  interactable: boolean;
  myColor: string;
  onCastling: (v: string) => void;
  squares: any[];
}) {
  const castlingBackgroundColor = Color.pink(0.7);
  return myColor === 'white' ? (
    <div style={{ gridArea: 'castling', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      {interactable &&
        !squares[57].isPiece &&
        !squares[58].isPiece &&
        !squares[59].isPiece &&
        squares[56].type === 'rook' &&
        !squares[56].moved &&
        squares[60].type === 'king' &&
        squares[60].state !== 'check' &&
        squares[60].state !== 'checkmate' &&
        !squares[60].moved && (
          <button
            type="button"
            aria-label="Castle queenside"
            className={css`
              cursor: pointer;
              border: 0;
              font: inherit;
              color: inherit;
              min-height: 32px;
              appearance: none;
              &:focus-visible {
                outline: 3px solid #334155;
                outline-offset: 2px;
              }
              position: relative;
              background: ${castlingBackgroundColor};
              display: flex;
              align-items: center;
              padding: 0 0.5rem 0 0.5rem;
              @media (max-width: ${tabletMaxWidth}) {
                font-size: 1.1rem;
              }
            `}
            onClick={() => onCastling('left')}
          >
            ←{' '}
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${tabletMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
              loading="lazy"
              src={WhiteKing}
              alt=""
            />
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${tabletMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
              loading="lazy"
              src={WhiteRook}
              alt=""
            />{' '}
            →
          </button>
        )}
      {interactable &&
        !squares[61].isPiece &&
        !squares[62].isPiece &&
        squares[63].type === 'rook' &&
        !squares[63].moved &&
        squares[60].type === 'king' &&
        squares[60].state !== 'check' &&
        squares[60].state !== 'checkmate' &&
        !squares[60].moved && (
          <button
            type="button"
            aria-label="Castle kingside"
            className={css`
              cursor: pointer;
              border: 0;
              font: inherit;
              color: inherit;
              min-height: 32px;
              appearance: none;
              &:focus-visible {
                outline: 3px solid #334155;
                outline-offset: 2px;
              }
              position: relative;
              background: ${castlingBackgroundColor};
              display: flex;
              align-items: center;
              padding: 0 0.5rem 0 0.5rem;
              @media (max-width: ${tabletMaxWidth}) {
                font-size: 1.1rem;
              }
            `}
            style={{ marginLeft: 'auto' }}
            onClick={() => onCastling('right')}
          >
            ←{' '}
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${tabletMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
              loading="lazy"
              src={WhiteRook}
              alt=""
            />
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${tabletMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
              loading="lazy"
              src={WhiteKing}
              alt=""
            />{' '}
            →
          </button>
        )}
    </div>
  ) : (
    <div style={{ gridArea: 'castling', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      {interactable &&
        !squares[57].isPiece &&
        !squares[58].isPiece &&
        squares[56].type === 'rook' &&
        !squares[56].moved &&
        squares[59].type === 'king' &&
        squares[59].state !== 'check' &&
        squares[59].state !== 'checkmate' &&
        !squares[59].moved && (
          <button
            type="button"
            aria-label="Castle kingside"
            className={css`
              cursor: pointer;
              border: 0;
              font: inherit;
              color: inherit;
              min-height: 32px;
              appearance: none;
              &:focus-visible {
                outline: 3px solid #334155;
                outline-offset: 2px;
              }
              position: relative;
              background: ${castlingBackgroundColor};
              display: flex;
              align-items: center;
              padding: 0 0.5rem 0 0.5rem;
              @media (max-width: ${tabletMaxWidth}) {
                font-size: 1.1rem;
              }
            `}
            onClick={() => onCastling('left')}
          >
            ←{' '}
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${tabletMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
              loading="lazy"
              src={BlackKing}
              alt=""
            />
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${tabletMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
              loading="lazy"
              src={BlackRook}
              alt=""
            />{' '}
            →
          </button>
        )}
      {interactable &&
        !squares[60].isPiece &&
        !squares[61].isPiece &&
        !squares[62].isPiece &&
        squares[63].type === 'rook' &&
        !squares[63].moved &&
        squares[59].type === 'king' &&
        squares[59].state !== 'check' &&
        squares[59].state !== 'checkmate' &&
        !squares[59].moved && (
          <button
            type="button"
            aria-label="Castle queenside"
            className={css`
              cursor: pointer;
              border: 0;
              font: inherit;
              color: inherit;
              min-height: 32px;
              appearance: none;
              &:focus-visible {
                outline: 3px solid #334155;
                outline-offset: 2px;
              }
              position: relative;
              background: ${castlingBackgroundColor};
              display: flex;
              align-items: center;
              padding: 0 0.5rem 0 0.5rem;
              @media (max-width: ${tabletMaxWidth}) {
                font-size: 1.1rem;
              }
            `}
            style={{ marginLeft: 'auto' }}
            onClick={() => onCastling('right')}
          >
            ←{' '}
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${tabletMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
              loading="lazy"
              src={BlackRook}
              alt=""
            />
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${tabletMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
              loading="lazy"
              src={BlackKing}
              alt=""
            />{' '}
            →
          </button>
        )}
    </div>
  );
}
