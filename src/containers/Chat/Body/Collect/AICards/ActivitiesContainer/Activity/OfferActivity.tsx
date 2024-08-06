import React, { useEffect, useMemo } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import CardThumb from '~/components/CardThumb';

export default function OfferActivity({
  card,
  feed,
  myId,
  onReceiveNewActivity,
  onSetUsermenuShown,
  isLastActivity
}: {
  card: any;
  feed: any;
  myId: number;
  onReceiveNewActivity: () => void;
  onSetUsermenuShown: (v: any) => any;
  isLastActivity: boolean;
}) {
  useEffect(() => {
    if (isLastActivity && myId !== feed.offer.user.id) {
      onReceiveNewActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const offer = useMemo(() => {
    return feed.offer;
  }, [feed]);

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
            ${offer.isCancelled ? `color: ${Color.lightGray()};` : ''};
            ${offer.isCancelled ? 'text-decoration: line-through;' : ''};
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.2rem;
            }
          `}
        >
          <UsernameText
            onMenuShownChange={onSetUsermenuShown}
            color={Color[offer.isCancelled ? 'lightGray' : 'black']()}
            user={{
              id: offer.user.id,
              username: offer.user.username
            }}
          />{' '}
          offered{' '}
          <b
            style={{
              color: Color[offer.isCancelled ? 'lightGray' : 'black']()
            }}
          >
            {addCommasToNumber(offer.price)}
          </b>{' '}
          Twinkle {offer.price === 1 ? 'Coin' : 'Coins'} for{' '}
          <b
            style={{
              color: Color[offer.isCancelled ? 'lightGray' : 'black']()
            }}
          >
            Card #{card.id}
          </b>
        </div>
        {!!offer.isCancelled && (
          <div
            className={css`
              margin-top: 1.5rem;
              font-size: 1.7rem;
              line-height: 1;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.2rem;
              }
            `}
          >
            This offer was revoked
          </div>
        )}
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
