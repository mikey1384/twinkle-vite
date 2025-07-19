import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import MyOffer from '../MyOffer';
import MakeOffer from '../MakeOffer';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { useAppContext, useKeyContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

NonOwnerMenu.propTypes = {
  cardId: PropTypes.number,
  className: PropTypes.string,
  myId: PropTypes.number,
  myOffer: PropTypes.object,
  onSetWithdrawOfferModalShown: PropTypes.func,
  onSetOfferModalShown: PropTypes.func,
  price: PropTypes.number,
  style: PropTypes.object
};
export default function NonOwnerMenu({
  cardId,
  className,
  myId,
  myOffer,
  onSetWithdrawOfferModalShown,
  onSetOfferModalShown,
  price,
  style
}: {
  cardId: number;
  className?: string;
  myId: number;
  myOffer?: any;
  onSetWithdrawOfferModalShown: (v: boolean) => void;
  onSetOfferModalShown: (v: boolean) => void;
  price: number;
  style?: React.CSSProperties;
}) {
  const buyAICard = useAppContext((v) => v.requestHelpers.buyAICard);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const notEnoughTwinkleCoins = twinkleCoins < price;
  const disabled = notEnoughTwinkleCoins || !!myOffer;
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        ...style
      }}
      className={className}
    >
      <div>
        <Button
          className={css`
            @media (max-width: ${mobileMaxWidth}) {
              padding: 0.7rem !important;
            }
          `}
          disabled={disabled}
          onClick={() => setConfirmModalShown(true)}
          color="oceanBlue"
          filled
        >
          {!disabled && (
            <Icon
              className={css`
                font-size: 1.6rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 0.8rem !important;
                }
              `}
              icon="shopping-cart"
            />
          )}
          <span
            className={css`
              font-size: 1.6rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
              }
            `}
            style={{ marginLeft: '0.7rem' }}
          >
            <span
              className={css`
                font-size: 1.6rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 0.8rem !important;
                }
              `}
            >
              {notEnoughTwinkleCoins
                ? 'Not enough coins'
                : myOffer
                ? 'Withdraw offer first'
                : 'Buy'}
            </span>
          </span>
        </Button>
      </div>
      <div>
        {myOffer ? (
          <MyOffer
            className={css`
              margin-top: 3rem;
              @media (max-width: ${mobileMaxWidth}) {
                margin-top: 1.5rem;
              }
            `}
            onSetWithdrawOfferModalShown={onSetWithdrawOfferModalShown}
            myOffer={myOffer}
          />
        ) : (
          <MakeOffer
            myId={myId}
            className={css`
              margin-top: 1.7rem;
              @media (max-width: ${mobileMaxWidth}) {
                margin-top: 1rem;
              }
            `}
            onSetOfferModalShown={onSetOfferModalShown}
          />
        )}
      </div>
      {confirmModalShown && (
        <ConfirmModal
          modalOverModal
          onHide={() => setConfirmModalShown(false)}
          descriptionFontSize="1.7rem"
          title={`Buy Card #${cardId}`}
          description={
            <span>
              Buy this card for <b>{addCommasToNumber(price)}</b> coins?
            </span>
          }
          onConfirm={handleConfirmBuy}
        />
      )}
    </div>
  );

  async function handleConfirmBuy() {
    const coins = await buyAICard(cardId);
    onSetUserState({ userId: myId, newState: { twinkleCoins: coins } });
    setConfirmModalShown(false);
  }
}
