import React, { useMemo, useState } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import CardThumb from '~/components/CardThumb';
import ErrorBoundary from '~/components/ErrorBoundary';
import moment from 'moment';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useChatContext } from '~/contexts';
import type { AICardOfferMessagePayload } from '~/helpers/aiCardOfferNotice';

export default function AICardOfferMessage({
  myId,
  myUsername,
  offerDetails,
  senderUsername,
  timeStamp,
  onSetAICardModalCardId
}: {
  myId: number;
  myUsername: string;
  offerDetails: AICardOfferMessagePayload;
  senderUsername: string;
  timeStamp: number;
  onSetAICardModalCardId: (cardId: number) => void;
}) {
  const [usermenuShown, setUsermenuShown] = useState(false);
  const cardId = Number(offerDetails.cardId || 0);
  const price = Number(offerDetails.price || 0);
  const offerId = Number(offerDetails.offerId || 0);
  // Live overlay from the ai_card_sold / ai_card_offer_cancelled socket
  // events (general-room broadcasts, so both DM participants receive them).
  // Only terminal statuses land in this map, and an offer can never leave a
  // terminal state, so the overlay always wins over the hydrated payload.
  const liveStatus = useChatContext((v) =>
    offerId ? v.state.aiCardOfferNoticeStatusById?.[offerId] : undefined
  );
  const status = liveStatus || offerDetails.status;
  const offererIsMe = Number(offerDetails.offererId) === myId;
  const displayedTimeStamp = useMemo(
    () => moment.unix(timeStamp).format('lll'),
    [timeStamp]
  );

  return (
    <ErrorBoundary componentPath="Chat/Message/AICardOfferMessage">
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
          if (!usermenuShown && cardId) onSetAICardModalCardId(cardId);
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
            <CardThumb card={{ id: cardId } as any} />
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
                  <UsernameText
                    displayedName={offererIsMe ? 'You' : senderUsername}
                    color={Color.black()}
                    onMenuShownChange={setUsermenuShown}
                    user={{
                      id: Number(offerDetails.offererId),
                      username: offererIsMe ? myUsername : senderUsername
                    }}
                  />{' '}
                  made an offer on{' '}
                  {offererIsMe ? (
                    <b style={{ color: Color.black() }}>Card #{cardId}</b>
                  ) : (
                    <>
                      your <b style={{ color: Color.black() }}>Card #{cardId}</b>
                    </>
                  )}{' '}
                  for{' '}
                  <b style={{ color: Color.black() }}>
                    {addCommasToNumber(price)}
                  </b>{' '}
                  Twinkle {price === 1 ? 'Coin' : 'Coins'}
                </div>
                {status !== 'open' ? (
                  <div
                    className={css`
                      margin-top: 0.5rem;
                      font-size: 1.3rem;
                      font-weight: bold;
                      color: ${status === 'accepted'
                        ? Color.green()
                        : Color.darkerGray()};
                      @media (max-width: ${mobileMaxWidth}) {
                        font-size: 1.1rem;
                      }
                    `}
                  >
                    {status === 'accepted'
                      ? 'This offer was accepted.'
                      : 'This offer has been withdrawn.'}
                  </div>
                ) : null}
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
            <CardThumb card={{ id: cardId } as any} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
