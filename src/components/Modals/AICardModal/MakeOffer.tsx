import React from 'react';
import Button from '~/components/Button';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function MakeOffer({
  myId,
  className,
  onSetOfferModalShown,
  style
}: {
  myId: number;
  className?: string;
  onSetOfferModalShown: (isShown: boolean) => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        ...style
      }}
    >
      <Button
        className={css`
          @media (max-width: ${mobileMaxWidth}) {
            padding: 0.7rem !important;
          }
        `}
        onClick={() => onSetOfferModalShown(true)}
        color="green"
        disabled={!myId}
        filled
      >
        <span
          className={css`
            font-size: 1.6rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
            }
          `}
        >
          Make offer
        </span>
      </Button>
    </div>
  );
}
