import React, { memo, useMemo } from 'react';
import Square from './Square';
import getPiece from './helpers/piece';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

function FallenPieces({
  whiteFallenPieces,
  blackFallenPieces,
  myColor
}: {
  whiteFallenPieces?: any[];
  blackFallenPieces?: any[];
  myColor: string;
}) {
  const whiteFallenPiecesCompressed = useMemo(() => {
    const whiteFallenHash: Record<string, any> = {};
    if (whiteFallenPieces) {
      for (let piece of whiteFallenPieces) {
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
      for (let piece of blackFallenPieces) {
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
        <div style={{ display: 'flex', marginBottom: '1rem' }}>
          {whiteFallenPiecesCompressed.map((piece, index) => {
            const fallenPiece = getPiece({ piece, myColor });
            return (
              <Square
                key={index}
                className={css`
                  height: 4rem;
                  width: 4rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    height: 3rem;
                    width: 3rem;
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
        <div style={{ display: 'flex', marginBottom: '1rem' }}>
          {blackFallenPiecesCompressed.map((piece, index) => {
            const fallenPiece = getPiece({ piece, myColor });
            return (
              <Square
                key={index}
                className={css`
                  height: 4rem;
                  width: 4rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    height: 3rem;
                    width: 3rem;
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
