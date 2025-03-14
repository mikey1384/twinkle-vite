import React from 'react';
import Modal from '~/components/Modal';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import Button from '~/components/Button';
import { cloudFrontURL } from '~/constants/defaultValues';

const WhiteQueen = `${cloudFrontURL}/assets/chess/WhiteQueen.svg`;
const WhiteRook = `${cloudFrontURL}/assets/chess/WhiteRook.svg`;
const WhiteBishop = `${cloudFrontURL}/assets/chess/WhiteBishop.svg`;
const WhiteKnight = `${cloudFrontURL}/assets/chess/WhiteKnight.svg`;

const BlackQueen = `${cloudFrontURL}/assets/chess/BlackQueen.svg`;
const BlackRook = `${cloudFrontURL}/assets/chess/BlackRook.svg`;
const BlackBishop = `${cloudFrontURL}/assets/chess/BlackBishop.svg`;
const BlackKnight = `${cloudFrontURL}/assets/chess/BlackKnight.svg`;

export default function PromotionModal({
  onHide,
  onPromote,
  color = 'white'
}: {
  onHide: () => void;
  onPromote: (piece: string) => void;
  color?: 'white' | 'black';
}) {
  const pieceChoices = [
    {
      type: 'queen',
      icon: color === 'white' ? WhiteQueen : BlackQueen
    },
    {
      type: 'rook',
      icon: color === 'white' ? WhiteRook : BlackRook
    },
    {
      type: 'bishop',
      icon: color === 'white' ? WhiteBishop : BlackBishop
    },
    {
      type: 'knight',
      icon: color === 'white' ? WhiteKnight : BlackKnight
    }
  ];

  return (
    <Modal modalOverModal small onHide={onHide} closeWhenClickedOutside={false}>
      <header>Promote Pawn</header>
      <main>
        <div
          className={css`
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            min-height: 200px;

            @media (max-width: ${mobileMaxWidth}) {
              padding: 0.5rem;
              min-height: 180px;
            }
          `}
        >
          <p
            className={css`
              font-size: 1.5rem;
            `}
          >
            Choose which piece to promote to:
          </p>
          <div
            className={css`
              display: flex;
              margin-top: 1rem;
              justify-content: center;
              align-items: center;
              gap: 1rem;

              @media (max-width: ${mobileMaxWidth}) {
                gap: 1rem;
                flex-wrap: wrap;
              }
            `}
          >
            {pieceChoices.map(({ type, icon }) => (
              <Button
                key={type}
                filled
                color={color === 'white' ? 'darkerGray' : 'lighterGray'}
                onClick={() => onPromote(type)}
                className={css`
                  padding: 1rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    padding: 0.5rem;
                  }
                `}
              >
                <img
                  src={icon}
                  alt={type}
                  className={css`
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                  `}
                />
              </Button>
            ))}
          </div>
        </div>
      </main>
      <footer
        className={css`
          display: flex;
          justify-content: flex-end;
          padding: 1rem;

          @media (max-width: ${mobileMaxWidth}) {
            padding: 0.5rem;
          }
        `}
      >
        <Button style={{ marginRight: '0.7rem' }} transparent onClick={onHide}>
          Cancel
        </Button>
      </footer>
    </Modal>
  );
}
