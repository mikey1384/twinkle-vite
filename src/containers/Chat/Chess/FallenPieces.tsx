import React, { memo, useMemo } from 'react';
import Square from './Square';
import getPiece from './helpers/piece';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

function FallenPieces({
  whiteFallenPieces,
  blackFallenPieces,
  myColor,
  size = 'regular'
}: {
  whiteFallenPieces?: any[];
  blackFallenPieces?: any[];
  myColor: string;
  size?: 'regular' | 'compact';
}) {
  const squareSize = size === 'compact' ? '2.5rem' : '4rem';
  const mobileSquareSize = size === 'compact' ? '2rem' : '3rem';
  const whiteFallenPiecesCompressed = useMemo(() => {
    const whiteFallenHash: Record<string, any> = {};
    if (whiteFallenPieces) {
      for (const piece of whiteFallenPieces) {
        if (!whiteFallenHash[piece.type]) {
          whiteFallenHash[piece.type] = { ...piece, count: 1 };
        } else {
          whiteFallenHash[piece.type].count += 1;
        }
      }
    }
    return Object.keys(whiteFallenHash).map((key) => whiteFallenHash[key]);
  }, [whiteFallenPieces]);

  const blackFallenPiecesCompressed = useMemo(() => {
    const blackFallenHash: Record<string, any> = {};
    if (blackFallenPieces) {
      for (const piece of blackFallenPieces) {
        if (!blackFallenHash[piece.type]) {
          blackFallenHash[piece.type] = { ...piece, count: 1 };
        } else {
          blackFallenHash[piece.type].count += 1;
        }
      }
    }
    return Object.keys(blackFallenHash).map((key) => blackFallenHash[key]);
  }, [blackFallenPieces]);

  return (
    <>
      {whiteFallenPiecesCompressed.length > 0 && (
        <div style={{ display: 'flex', marginBottom: '0.25rem' }}>
          {whiteFallenPiecesCompressed.map((piece, index) => {
            const fallenPiece = getPiece({ piece, myColor });
            return (
              <Square
                key={index}
                className={css`
                  height: ${squareSize};
                  width: ${squareSize};
                  @media (max-width: ${mobileMaxWidth}) {
                    height: ${mobileSquareSize};
                    width: ${mobileSquareSize};
                  }
                `}
                img={fallenPiece.img}
                count={piece.count}
                color="white"
              />
            );
          })}
        </div>
      )}
      {blackFallenPiecesCompressed.length > 0 && (
        <div style={{ display: 'flex', marginBottom: '0.25rem' }}>
          {blackFallenPiecesCompressed.map((piece, index) => {
            const fallenPiece = getPiece({ piece, myColor });
            return (
              <Square
                key={index}
                className={css`
                  height: ${squareSize};
                  width: ${squareSize};
                  @media (max-width: ${mobileMaxWidth}) {
                    height: ${mobileSquareSize};
                    width: ${mobileSquareSize};
                  }
                `}
                img={fallenPiece.img}
                count={piece.count}
                color="black"
              />
            );
          })}
        </div>
      )}
    </>
  );
}

export default memo(FallenPieces);
