import React from 'react';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Color, mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

const BlackRook = `${cloudFrontURL}/assets/chess/BlackRook.svg`;
const BlackKing = `${cloudFrontURL}/assets/chess/BlackKing.svg`;

const WhiteRook = `${cloudFrontURL}/assets/chess/WhiteRook.svg`;
const WhiteKing = `${cloudFrontURL}/assets/chess/WhiteKing.svg`;

export default function CastlingButton({
  interactable,
  playerColor,
  onCastling,
  squares
}: {
  interactable: boolean;
  playerColor: string;
  onCastling: (direction: 'kingside' | 'queenside') => void;
  squares: any[];
}) {
  const bottomOffset = '0.5rem';
  const castlingBackgroundColor = Color.pink(0.7);

  return playerColor === 'white' ? (
    <>
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
          <div
            className={css`
              cursor: pointer;
              position: absolute;
              background: ${castlingBackgroundColor};
              bottom: ${bottomOffset};
              left: 0;
              z-index: 2;
              display: flex;
              align-items: center;
              padding: 0 0.5rem 0 0.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
                left: 0;
                bottom: ${bottomOffset};
              }
            `}
            onClick={() => onCastling('queenside')}
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
          </div>
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
          <div
            className={css`
              cursor: pointer;
              position: absolute;
              background: ${castlingBackgroundColor};
              bottom: ${bottomOffset};
              right: 0;
              z-index: 2;
              display: flex;
              align-items: center;
              padding: 0 0.5rem 0 0.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
                right: 0;
                bottom: ${bottomOffset};
              }
            `}
            onClick={() => onCastling('kingside')}
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
          </div>
        )}
    </>
  ) : (
    <>
      {interactable &&
        !squares[1].isPiece &&
        !squares[2].isPiece &&
        !squares[3].isPiece &&
        squares[0].type === 'rook' &&
        !squares[0].moved &&
        squares[4].type === 'king' &&
        squares[4].state !== 'check' &&
        squares[4].state !== 'checkmate' &&
        !squares[4].moved && (
          <div
            className={css`
              cursor: pointer;
              position: absolute;
              background: ${castlingBackgroundColor};
              bottom: ${bottomOffset};
              left: 0;
              z-index: 2;
              display: flex;
              align-items: center;
              padding: 0 0.5rem 0 0.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
                left: 0;
                bottom: ${bottomOffset};
              }
            `}
            onClick={() => onCastling('queenside')}
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
          </div>
        )}
      {interactable &&
        !squares[5].isPiece &&
        !squares[6].isPiece &&
        squares[7].type === 'rook' &&
        !squares[7].moved &&
        squares[4].type === 'king' &&
        squares[4].state !== 'check' &&
        squares[4].state !== 'checkmate' &&
        !squares[4].moved && (
          <div
            className={css`
              cursor: pointer;
              position: absolute;
              background: ${castlingBackgroundColor};
              bottom: ${bottomOffset};
              right: 0;
              z-index: 2;
              display: flex;
              align-items: center;
              padding: 0 0.5rem 0 0.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
                right: 0;
                bottom: ${bottomOffset};
              }
            `}
            onClick={() => onCastling('kingside')}
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
          </div>
        )}
    </>
  );
}
