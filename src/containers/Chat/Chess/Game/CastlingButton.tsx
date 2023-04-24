import React from 'react';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Color, mobileMaxWidth } from '~/constants/css';
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
  const top = 'CALC(100% - 6rem)';
  const mobileTop = 'CALC(50vw + 0.5rem)';
  const mobileCastlingBackgroundColor = Color.pink(0.7);
  return myColor === 'white' ? (
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
              background: RGB(255, 255, 255, 0.7);
              top: ${top};
              left: 89px;
              display: flex;
              align-items: center;
              padding: 0 0.5rem 0 0.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                background: ${mobileCastlingBackgroundColor};
                font-size: 1rem;
                left: 0;
                top: ${mobileTop};
              }
            `}
            onClick={() => onCastling('left')}
          >
            ←{' '}
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${mobileMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
              src={WhiteKing}
              alt=""
            />
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${mobileMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
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
              background: RGB(255, 255, 255, 0.7);
              top: ${top};
              left: 246px;
              display: flex;
              align-items: center;
              padding: 0 0.5rem 0 0.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                background: ${mobileCastlingBackgroundColor};
                font-size: 1rem;
                left: CALC(100% - 7rem);
                top: ${mobileTop};
              }
            `}
            onClick={() => onCastling('right')}
          >
            ←{' '}
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${mobileMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
              src={WhiteRook}
              alt=""
            />
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${mobileMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
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
        !squares[57].isPiece &&
        !squares[58].isPiece &&
        squares[56].type === 'rook' &&
        !squares[56].moved &&
        squares[59].type === 'king' &&
        squares[59].state !== 'check' &&
        squares[59].state !== 'checkmate' &&
        !squares[59].moved && (
          <div
            className={css`
              cursor: pointer;
              position: absolute;
              background: RGB(255, 255, 255, 0.7);
              top: ${top};
              left: 66px;
              display: flex;
              align-items: center;
              padding: 0 0.5rem 0 0.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                background: ${mobileCastlingBackgroundColor};
                font-size: 1rem;
                left: 0;
                top: ${mobileTop};
              }
            `}
            onClick={() => onCastling('left')}
          >
            ←{' '}
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${mobileMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
              src={BlackKing}
              alt=""
            />
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${mobileMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
              src={BlackRook}
              alt=""
            />{' '}
            →
          </div>
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
          <div
            className={css`
              cursor: pointer;
              position: absolute;
              background: RGB(255, 255, 255, 0.7);
              top: ${top};
              left: 223px;
              display: flex;
              align-items: center;
              padding: 0 0.5rem 0 0.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                background: ${mobileCastlingBackgroundColor};
                font-size: 1rem;
                left: CALC(100% - 7rem);
                top: ${mobileTop};
              }
            `}
            onClick={() => onCastling('right')}
          >
            ←{' '}
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${mobileMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
              src={BlackRook}
              alt=""
            />
            <img
              className={css`
                width: 2.5rem;
                height: 2.5rem;
                @media (max-width: ${mobileMaxWidth}) {
                  width: 2rem;
                  height: 2rem;
                }
              `}
              src={BlackKing}
              alt=""
            />{' '}
            →
          </div>
        )}
    </>
  );
}
