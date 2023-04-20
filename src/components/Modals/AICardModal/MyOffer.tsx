import React from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

export default function MyOffer({
  myOffer,
  style,
  className,
  onSetWithdrawOfferModalShown
}: {
  myOffer: any;
  style?: React.CSSProperties;
  className?: string;
  onSetWithdrawOfferModalShown: (isShown: boolean) => void;
}) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <div
        className={css`
          font-size: 1.6rem;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1rem;
          }
        `}
        style={{ textAlign: 'center' }}
      >
        <p>You offered</p>
        <p>
          <Icon
            style={{ color: Color.brownOrange() }}
            icon={['far', 'badge-dollar']}
          />
          <span
            style={{
              marginLeft: '0.3rem',
              color: Color.darkerGray(),
              fontWeight: 'bold'
            }}
          >
            {addCommasToNumber(myOffer.price)}
          </span>
        </p>
      </div>
      <div
        className={css`
          margin-top: 1.3rem;
          @media (max-width: ${mobileMaxWidth}) {
            margin-top: 0.7rem;
          }
        `}
      >
        <Button
          className={css`
            @media (max-width: ${mobileMaxWidth}) {
              padding: 0.7rem !important;
            }
          `}
          onClick={() => onSetWithdrawOfferModalShown(true)}
          color="orange"
          filled
        >
          <Icon
            className={css`
              font-size: 1.6rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 0.8rem !important;
              }
            `}
            icon="redo"
          />
          <span
            style={{ marginLeft: '0.7rem' }}
            className={css`
              font-size: 1.6rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 0.8rem !important;
              }
            `}
          >
            Withdraw Offer
          </span>
        </Button>
      </div>
    </div>
  );
}
