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
  canKingside,
  canQueenside
}: {
  interactable: boolean;
  playerColor: string;
  onCastling: (direction: 'kingside' | 'queenside') => void;
  canKingside: boolean;
  canQueenside: boolean;
}) {
  // Lower the overlay so it covers file letters area, not board squares
  const bottomOffset = '-2.3rem';
  const castlingBackgroundColor = Color.pink(0.7);

  return playerColor === 'white' ? (
    <>
      {interactable && canQueenside && (
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
      {interactable && canKingside && (
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
      {interactable && canQueenside && (
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
      {interactable && canKingside && (
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
