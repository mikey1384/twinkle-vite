import React, { useEffect, useMemo } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import moment from 'moment';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import CardThumb from '~/components/CardThumb';

export default function TransferActivity({
  card,
  feed,
  myId,
  myUsername,
  onReceiveNewActivity,
  onSetUsermenuShown,
  isLastActivity
}: {
  card: any;
  feed: any;
  myId: number;
  myUsername: string;
  onReceiveNewActivity: () => void;
  onSetUsermenuShown: (arg0: boolean) => void;
  isLastActivity: boolean;
}) {
  const transferData = useMemo(() => {
    const transferDetails = feed?.transfer || {};
    const isPurchase = !!transferDetails.askId;
    const isSale = !!transferDetails.offerId;
    const isTransaction = isPurchase || isSale;
    const card = transferDetails.card;
    const displayedTimeStamp = moment
      .unix(transferDetails.timeStamp)
      .format('lll');
    const price = isTransaction
      ? isPurchase
        ? transferDetails.ask?.price
        : transferDetails.offer?.price
      : 0;
    return { isPurchase, isSale, card, displayedTimeStamp, price };
  }, [feed?.transfer]);

  useEffect(() => {
    if (isLastActivity) {
      if (transferData.isPurchase && myId !== feed?.transfer?.to?.id) {
        onReceiveNewActivity();
      }
      if (transferData.isSale && myId !== feed?.transfer?.from?.id) {
        onReceiveNewActivity();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actionDescription = useMemo(() => {
    const transferDetails = feed?.transfer || {};
    const { displayedTimeStamp, isPurchase, isSale, price } = transferData;
    const buyer =
      transferDetails.to.id === myId
        ? { id: myId, username: myUsername }
        : { id: transferDetails.to.id, username: transferDetails.to.username };
    const seller =
      transferDetails.from.id === myId
        ? { id: myId, username: myUsername }
        : {
            id: transferDetails.from.id,
            username: transferDetails.from.username
          };

    if (isPurchase || isSale) {
      return (
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
                  onMenuShownChange={onSetUsermenuShown}
                  color={Color.black()}
                  user={buyer}
                />{' '}
                bought <b style={{ color: Color.black() }}>Card #{card.id}</b>{' '}
                from{' '}
                <UsernameText
                  displayedName={seller.id === myId ? 'you' : seller.username}
                  onMenuShownChange={onSetUsermenuShown}
                  color={Color.black()}
                  user={seller}
                />{' '}
              </>
            ) : (
              <>
                <UsernameText
                  displayedName={seller.id === myId ? 'You' : seller.username}
                  onMenuShownChange={onSetUsermenuShown}
                  color={Color.black()}
                  user={seller}
                />{' '}
                sold <b style={{ color: Color.black() }}>Card #{card.id}</b> to{' '}
                <UsernameText
                  displayedName={buyer.id === myId ? 'you' : buyer.username}
                  onMenuShownChange={onSetUsermenuShown}
                  color={Color.black()}
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
      );
    }
    return '';
  }, [
    card.id,
    feed?.transfer,
    myId,
    myUsername,
    onSetUsermenuShown,
    transferData
  ]);

  return (
    <div
      className={css`
        padding: 0 3rem 0 2rem;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0 1rem 0 0.5rem;
        }
      `}
      style={{
        display: 'flex',
        width: '100%',
        height: '100%'
      }}
    >
      <div
        style={{
          width: '5rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CardThumb card={card} />
      </div>
      <div
        style={{
          width: 'CALC(100% - 5rem)',
          marginLeft: '3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div
          className={css`
            padding-right: 1rem;
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
        style={{
          width: '5rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CardThumb card={card} />
      </div>
    </div>
  );
}
