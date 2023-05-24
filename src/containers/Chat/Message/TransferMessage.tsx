import React, { useMemo, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import CardThumb from '~/components/CardThumb';
import ErrorBoundary from '~/components/ErrorBoundary';
import moment from 'moment';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

export default function TransferMessage({
  myId,
  myUsername,
  partner,
  transferDetails,
  onSetAICardModalCardId
}: {
  myId: number;
  myUsername: string;
  partner: {
    id: number;
    username: string;
  };
  transferDetails: any;
  onSetAICardModalCardId: (cardId: number) => void;
}) {
  const [usermenuShown, setUsermenuShown] = useState(false);

  const transferData = useMemo(() => {
    const isPurchase = !!transferDetails?.askId;
    const isSale = !!transferDetails?.offerId;
    const isTransaction = isPurchase || isSale;
    const card = transferDetails.card;
    const displayedTimeStamp = moment
      .unix(transferDetails.timeStamp)
      .format('lll');
    const price = isTransaction
      ? isPurchase
        ? transferDetails?.ask?.price
        : transferDetails?.offer?.price
      : 0;
    return { isPurchase, isSale, card, displayedTimeStamp, price };
  }, [transferDetails]);

  const actionDescription = useMemo(() => {
    const { isPurchase, isSale, card, displayedTimeStamp, price } =
      transferData;
    const buyer =
      transferDetails.to === myId
        ? { id: myId, username: myUsername }
        : partner;
    const seller =
      transferDetails.from === myId
        ? { id: myId, username: myUsername }
        : partner;
    const action = isPurchase ? 'bought' : 'sold';
    const path = `Chat/Message/TransferMessage/${isPurchase ? 'buy' : 'sell'}`;

    if (isPurchase || isSale) {
      return (
        <ErrorBoundary componentPath={path}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div>
              {isPurchase ? (
                <>
                  <UsernameText
                    displayedName={buyer.id === myId ? 'You' : buyer.username}
                    color={Color.black()}
                    onMenuShownChange={setUsermenuShown}
                    user={buyer}
                  />{' '}
                  {action}{' '}
                  <b style={{ color: Color.black() }}>Card #{card.id}</b> from{' '}
                  <UsernameText
                    displayedName={seller.id === myId ? 'you' : seller.username}
                    color={Color.black()}
                    onMenuShownChange={setUsermenuShown}
                    user={seller}
                  />{' '}
                </>
              ) : (
                <>
                  <UsernameText
                    displayedName={seller.id === myId ? 'You' : seller.username}
                    color={Color.black()}
                    onMenuShownChange={setUsermenuShown}
                    user={seller}
                  />{' '}
                  {action}{' '}
                  <b style={{ color: Color.black() }}>Card #{card.id}</b> to{' '}
                  <UsernameText
                    displayedName={buyer.id === myId ? 'you' : buyer.username}
                    color={Color.black()}
                    onMenuShownChange={setUsermenuShown}
                    user={buyer}
                  />{' '}
                </>
              )}
              for{' '}
              <b style={{ color: Color.black() }}>{addCommasToNumber(price)}</b>{' '}
              Twinkle {price === 1 ? 'Coin' : 'Coins'}
            </div>
            <div
              className={css`
                font-size: 1.3rem;
                margin-top: 1.7rem;
                font-family: Roboto, sans-serif;
                color: ${Color.darkerGray()};
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.2rem;
                }
              `}
            >
              {displayedTimeStamp}
            </div>
          </div>
        </ErrorBoundary>
      );
    }
    return '';
  }, [
    transferData,
    transferDetails.to,
    transferDetails.from,
    myId,
    myUsername,
    partner
  ]);

  return (
    <div
      style={{
        width: '100%',
        padding: '2rem 1rem',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        marginTop: '3rem',
        marginBottom: '3rem'
      }}
      className={css`
        cursor: pointer;
        background: ${Color.whiteGray()};
        &:hover {
          background: ${Color.highlightGray()};
        }
      `}
      onClick={() => {
        if (!usermenuShown) onSetAICardModalCardId(transferDetails.card.id);
      }}
    >
      <div
        className={css`
          display: flex;
          width: 100%;
          height: 100%;
          padding: 0 2rem 0 2rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 0 0.5rem 0 0.5rem;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            justify-content: flex-start;
            align-items: center;
            width: 5rem;
          `}
        >
          <CardThumb card={transferData.card} />
        </div>
        <div
          className={css`
            width: CALC(100% - 5rem);
            margin-left: 3rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          `}
        >
          <div
            className={css`
              flex-grow: 1;
              display: flex;
              justify-content: center;
              font-size: 1.7rem;
              line-height: 1.5;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.2rem;
              }
            `}
          >
            {actionDescription}
          </div>
        </div>
        <div
          className={css`
            display: flex;
            justify-content: flex-end;
            align-items: center;
            width: 5rem;
          `}
        >
          <CardThumb card={transferData.card} />
        </div>
      </div>
    </div>
  );
}
