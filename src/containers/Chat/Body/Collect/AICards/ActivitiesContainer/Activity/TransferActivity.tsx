import React, { useEffect, useMemo } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import CardThumb from '~/components/CardThumb';

export default function TransferActivity({
  card,
  feed,
  myId,
  onReceiveNewActivity,
  onSetUsermenuShown,
  onSetScrollToBottom,
  isLastActivity
}: {
  card: any;
  feed: any;
  myId: number;
  onReceiveNewActivity: () => void;
  onSetUsermenuShown: (arg0: boolean) => void;
  onSetScrollToBottom: () => void;
  isLastActivity: boolean;
}) {
  const isPurchase = useMemo(() => !!feed?.transfer?.askId, [feed]);
  const isSale = useMemo(() => !!feed?.transfer?.offerId, [feed]);
  const isTransaction = useMemo(
    () => isPurchase || isSale,
    [isPurchase, isSale]
  );

  useEffect(() => {
    if (isLastActivity) {
      if (isPurchase && myId === feed?.transfer?.to?.id) {
        onSetScrollToBottom();
      }
      if (isSale && myId === feed?.transfer?.from?.id) {
        onSetScrollToBottom();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLastActivity) {
      if (isPurchase && myId !== feed?.transfer?.to?.id) {
        onReceiveNewActivity();
      }
      if (isSale && myId !== feed?.transfer?.from?.id) {
        onReceiveNewActivity();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const transfer = useMemo(() => {
    return feed.transfer;
  }, [feed]);

  const price = useMemo(() => {
    if (!isTransaction) {
      return 0;
    }
    return isPurchase ? transfer?.ask?.price : transfer?.offer?.price;
  }, [isPurchase, isTransaction, transfer?.ask?.price, transfer?.offer?.price]);

  const actionDescription = useMemo(() => {
    if (isPurchase) {
      return (
        <div>
          <UsernameText
            displayedName={
              transfer.to.id === myId ? 'You' : transfer.to.username
            }
            onMenuShownChange={onSetUsermenuShown}
            color={Color.black()}
            user={{
              id: transfer.to.id,
              username: transfer.to.username
            }}
          />{' '}
          bought{' '}
          <b
            style={{
              color: Color.black()
            }}
          >
            Card #{card.id}
          </b>{' '}
          from{' '}
          <UsernameText
            displayedName={
              transfer.from.id === myId ? 'you' : transfer.from.username
            }
            onMenuShownChange={onSetUsermenuShown}
            color={Color.black()}
            user={{
              id: transfer.from.id,
              username: transfer.from.username
            }}
          />{' '}
          for{' '}
          <b
            style={{
              color: Color.black()
            }}
          >
            {addCommasToNumber(price)}
          </b>{' '}
          Twinkle {price === 1 ? 'Coin' : 'Coins'}
        </div>
      );
    }
    if (isSale) {
      return (
        <div>
          <UsernameText
            displayedName={
              transfer.from.id === myId ? 'You' : transfer.from.username
            }
            onMenuShownChange={onSetUsermenuShown}
            color={Color.black()}
            user={{
              id: transfer.from.id,
              username: transfer.from.username
            }}
          />{' '}
          sold{' '}
          <b
            style={{
              color: Color.black()
            }}
          >
            Card #{card.id}
          </b>{' '}
          to{' '}
          <UsernameText
            displayedName={
              transfer.to.id === myId ? 'you' : transfer.to.username
            }
            onMenuShownChange={onSetUsermenuShown}
            color={Color.black()}
            user={{
              id: transfer.to.id,
              username: transfer.to.username
            }}
          />{' '}
          for{' '}
          <b
            style={{
              color: Color.black()
            }}
          >
            {addCommasToNumber(price)}
          </b>{' '}
          Twinkle {price === 1 ? 'Coin' : 'Coins'}
        </div>
      );
    }
    return '';
  }, [
    card.id,
    isPurchase,
    isSale,
    myId,
    onSetUsermenuShown,
    price,
    transfer.from.id,
    transfer.from.username,
    transfer.to.id,
    transfer.to.username
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
