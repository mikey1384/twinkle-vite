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
  canQueenside,
  onPreClickLog
}: {
  interactable: boolean;
  playerColor: string;
  onCastling: (direction: 'kingside' | 'queenside') => void;
  canKingside: boolean;
  canQueenside: boolean;
  onPreClickLog?: (direction: 'kingside' | 'queenside') => void;
}) {
  // Position overlay slightly below the board so it sits over the file letters
  const bottomOffset = '-2.3rem';
  const castlingBackgroundColor = Color.pink(0.7);
  const isWhite = playerColor === 'white';
  const King = isWhite ? WhiteKing : BlackKing;
  const Rook = isWhite ? WhiteRook : BlackRook;
  const canLeft = isWhite ? canQueenside : canKingside;
  const canRight = isWhite ? canKingside : canQueenside;

  return (
    <>
      {interactable && canLeft && (
        <div
          className={css`
            cursor: pointer;
            position: absolute;
            background: ${castlingBackgroundColor};
            bottom: ${bottomOffset};
            left: 0; /* Left edge from player's perspective: queenside for white, kingside for black */
            z-index: 999;
            display: flex;
            align-items: center;
            padding: 0 0.5rem 0 0.5rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
              left: 0;
              bottom: ${bottomOffset};
            }
          `}
          onClick={() => {
            const direction = isWhite ? 'queenside' : 'kingside';
            try {
              onPreClickLog &&
                onPreClickLog(direction as 'kingside' | 'queenside');
            } catch {}
            onCastling(direction as 'kingside' | 'queenside');
          }}
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
            src={King}
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
            src={Rook}
            alt=""
          />{' '}
          →
        </div>
      )}
      {interactable && canRight && (
        <div
          className={css`
            cursor: pointer;
            position: absolute;
            background: ${castlingBackgroundColor};
            bottom: ${bottomOffset};
            right: 0; /* Right edge from player's perspective: kingside for white, queenside for black */
            z-index: 999;
            display: flex;
            align-items: center;
            padding: 0 0.5rem 0 0.5rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
              right: 0;
              bottom: ${bottomOffset};
            }
          `}
          onClick={() => {
            const direction = isWhite ? 'kingside' : 'queenside';
            try {
              onPreClickLog &&
                onPreClickLog(direction as 'kingside' | 'queenside');
            } catch {}
            onCastling(direction as 'kingside' | 'queenside');
          }}
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
            src={Rook}
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
            src={King}
            alt=""
          />{' '}
          →
        </div>
      )}
    </>
  );
}
