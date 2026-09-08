import React from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
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
    <Modal
      modalKey="PromotionModal"
      aria-label="Promote pawn"
      isOpen
      size="sm"
      onClose={onHide}
      closeOnBackdropClick={false}
      modalLevel={2}
      hasHeader={false}
      bodyPadding={0}
    >
      <LegacyModalLayout>
        <header style={{ fontSize: 20 }}>Promote Pawn</header>
        <main>
          <div
            className={css`
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 8px 0 16px;
              width: 100%;
            `}
          >
            <p
              className={css`
                font-size: 16px;
                line-height: 1.5;
                text-align: center;
              `}
            >
              Choose which piece to promote to:
            </p>
            <div
              className={css`
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                margin-top: 16px;
                gap: 8px;
                width: 100%;
                max-width: 360px;
                @media (max-width: 480px) {
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                }
              `}
            >
              {pieceChoices.map(({ type, icon }) => (
                <Button
                  key={type}
                  variant="solid"
                  aria-label={`Promote to ${type}`}
                  uppercase={false}
                  style={{ fontSize: 14, color: color === 'black' ? '#222' : '#fff' }}
                  color={color === 'white' ? 'darkerGray' : 'lighterGray'}
                  onClick={() => onPromote(type)}
                  className={css`
                    flex-direction: column;
                    gap: 6px;
                    padding: 10px;
                    min-height: 76px;
                    min-width: 0;
                    font-size: 14px;
                  `}
                >
                  <img
                    src={icon}
                    alt=""
                    className={css`
                      width: 36px;
                      height: 36px;
                      object-fit: contain;
                    `}
                  />
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
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
          <Button
            style={{ minHeight: 44, fontSize: 14 }}
            variant="ghost"
            onClick={onHide}
          >
            Cancel
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );
}
