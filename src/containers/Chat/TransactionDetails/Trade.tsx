import React, { useMemo } from 'react';
import OfferPanel from './OfferPanel';
import WantPanel from './WantPanel';
import Heading from './Heading';
import UsernameText from '~/components/Texts/UsernameText';
import Body from './Body';
import { css } from '@emotion/css';
import { mobileMaxWidth, Color } from '~/constants/css';

export default function Trade({
  isAccepted,
  isOnModal,
  isAICardModalShown,
  isCurrent,
  isCancelled,
  cancelReason,
  myId,
  toId,
  myUsername,
  partner,
  onSetAICardModalCardId,
  onClick,
  offerCardIds,
  offerCoins,
  timeStamp,
  wantCardIds,
  wantCoins,
  fromId
}: {
  isAccepted: boolean;
  isOnModal?: boolean;
  isCurrent: boolean;
  isCancelled: boolean;
  isAICardModalShown: boolean;
  cancelReason: string;
  myId: number;
  myUsername: string;
  partner: { id: number; username: string };
  onSetAICardModalCardId: (cardId: number) => void;
  wantCardIds: number[];
  wantCoins: number;
  offerCardIds: number[];
  offerCoins: number;
  onClick?: () => void;
  timeStamp: number;
  fromId: number;
  toId: number;
}) {
  const from = useMemo(() => {
    return fromId === myId ? { id: myId, username: myUsername } : partner;
  }, [fromId, myId, myUsername, partner]);
  const to = useMemo(() => {
    return toId === myId ? { id: myId, username: myUsername } : partner;
  }, [toId, myId, myUsername, partner]);

  const isTrade = useMemo(() => {
    return !!offerCardIds.length || !!offerCoins;
  }, [offerCardIds, offerCoins]);

  const cancelReasonText = useMemo(() => {
    if (cancelReason === 'withdraw') {
      return `${
        from.username === myUsername ? 'You' : from.username
      } withdrew the trade proposal.`;
    }
    if (cancelReason === 'decline') {
      return `${
        to.username === myUsername ? 'You' : to.username
      } declined the trade proposal.`;
    }
  }, [cancelReason, from.username, myUsername, to.username]);

  const acceptedText = useMemo(() => {
    if (isAccepted) {
      return `${
        to.username === myUsername ? 'You' : to.username
      } accepted the proposal. Trade has been completed.`;
    }
    return '';
  }, [isAccepted, myUsername, to.username]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%'
      }}
    >
      <Heading isCurrent={isCurrent} color="logoBlue" timeStamp={timeStamp}>
        <div>
          <UsernameText
            displayedName={from.id === myId ? 'You' : from.username}
            color="#fff"
            user={{
              id: from.id,
              username: from.username
            }}
          />{' '}
          {isTrade
            ? `proposed a trade`
            : wantCoins
            ? `want${from.id === myId ? '' : 's'}`
            : `${from.id === myId ? 'are' : 'is'} interested in`}
        </div>
      </Heading>
      <Body onClick={onClick}>
        {isTrade && (
          <OfferPanel
            isTrade
            imOffering={from.id === myId}
            isOnModal={isOnModal}
            isAICardModalShown={isAICardModalShown}
            offerCardIds={offerCardIds}
            offerCoins={offerCoins}
            onSetAICardModalCardId={onSetAICardModalCardId}
            showCardDetailsOnThumbClick={!onClick}
          />
        )}
        <WantPanel
          imOffering={from.id === myId}
          style={{ marginTop: isTrade ? '1rem' : 0 }}
          isAICardModalShown={isAICardModalShown}
          isOnModal={isOnModal}
          isTrade={isTrade}
          wantCardIds={wantCardIds}
          wantCoins={wantCoins}
          onSetAICardModalCardId={onSetAICardModalCardId}
          showCardDetailsOnThumbClick={!onClick}
        />
        {isTrade && (isAccepted || isCancelled) && (
          <div
            style={{
              marginTop: '1.5rem',
              marginBottom: '0.5rem',
              fontFamily: 'Roboto, sans-serif',
              color: Color[isAccepted ? 'green' : 'darkerGray']()
            }}
            className={css`
              font-size: 1.6rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.3rem;
              }
            `}
          >
            {isAccepted ? acceptedText : cancelReasonText}
          </div>
        )}
      </Body>
    </div>
  );
}
