import React, { useEffect } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import Exchange from '../Trade/Exchange';
import {
  emptyBundle,
  getViewerTradeTerms,
  normalizeBundle
} from '../Trade/helpers/terms';
import { getTradeStatus } from '../Trade/helpers/status';
import UsernameText from '~/components/Texts/UsernameText';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useChatContext, useKeyContext } from '~/contexts';

export default function TransactionDetails({
  currentTransactionId,
  onClick,
  isAICardModalShown: _isAICardModalShown,
  isOnModal,
  groupObjs,
  onSetGroupObjs,
  onSetAICardModalCardId,
  transaction,
  partner,
  style
}: {
  currentTransactionId: number;
  onClick?: () => void;
  isAICardModalShown: boolean;
  isOnModal?: boolean;
  groupObjs: Record<number, any>;
  onSetAICardModalCardId: (cardId: number) => void;
  onSetGroupObjs: React.Dispatch<React.SetStateAction<Record<number, any>>>;
  transaction: any;
  partner: any;
  style?: React.CSSProperties;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const acceptedTransactions = useChatContext(
    (v) => v.state.acceptedTransactions
  );
  const cancelledTransactions = useChatContext(
    (v) => v.state.cancelledTransactions
  );
  const isAccepted =
    acceptedTransactions[transaction.id] || !!transaction.isAccepted;
  const isCancelled =
    !!cancelledTransactions[transaction.id] || !!transaction.isCancelled;
  const cancelReason =
    cancelledTransactions[transaction.id] || transaction.cancelReason;
  const { type, want = {}, offer = {} } = transaction;
  const { cards: wantCards = [], groups: wantGroups = [] } = want || {};
  const { cards: offerCards = [], groups: offerGroups = [] } = offer || {};

  useEffect(() => {
    if (wantCards.length) {
      for (const card of wantCards) {
        onUpdateAICard({ cardId: card.id, newState: card, isInit: true });
      }
    }
    if (offerCards.length) {
      for (const card of offerCards) {
        onUpdateAICard({ cardId: card.id, newState: card, isInit: true });
      }
    }
    if (wantGroups?.length || offerGroups?.length) {
      const newGroupObjs = [
        ...(wantGroups || []),
        ...(offerGroups || [])
      ].reduce((acc: any, group: any) => {
        acc[group.id] = group;
        return acc;
      }, {});
      onSetGroupObjs((prev) => ({
        ...prev,
        ...newGroupObjs
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transaction.id, transaction.offer, transaction.want]);

  const isFromMe = Number(transaction.from) === Number(userId);
  const from = isFromMe ? { id: userId, username } : partner;
  const to =
    Number(transaction.to) === Number(userId)
      ? { id: userId, username }
      : partner;
  const terms =
    type === 'show'
      ? { give: normalizeBundle(offer), receive: emptyBundle() }
      : getViewerTradeTerms(transaction, userId);
  const {
    label: status,
    settled,
    cancelled,
    requestOnly
  } = getTradeStatus({
    transaction,
    viewerId: userId,
    isAccepted: !!isAccepted,
    isCancelled,
    cancelReason,
    isCurrent: transaction.id === currentTransactionId
  });
  const statusNote =
    type === 'show'
      ? 'Nothing changes owners.'
      : type === 'send'
        ? 'A gift, with nothing in return.'
        : isAccepted
          ? 'All items have changed owners.'
          : cancelled
            ? 'Nothing moved.'
            : requestOnly
              ? 'Waiting for a response. Nothing moves yet.'
              : 'Nothing moves until this offer is accepted.';
  const canOpen =
    !isOnModal && !!onClick && (!settled || type === 'send') && !cancelled;
  const statusColor = settled ? '#126b65' : cancelled ? '#65738a' : '#315b91';

  return (
    <ErrorBoundary componentPath="Chat/TransactionDetails">
      <article
        className={css`
          width: 100%;
          min-width: 0;
          ${!isOnModal ? 'max-width: 72rem; margin: 1.4rem auto; padding: 1.6rem; border: 1px solid #dce4ee; border-radius: 1.6rem; background: #fff; box-shadow: 0 3px 12px #203c6008;' : ''}
          @media (max-width: 450px) {
            ${!isOnModal ? 'padding: 1rem;' : ''}
          }
        `}
        aria-label={status}
        style={style}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1.4rem'
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                fontSize: '1.6rem',
                fontWeight: 800,
                color: statusColor
              }}
            >
              <Icon
                icon={
                  type === 'send'
                    ? 'gift'
                    : isAccepted
                      ? 'check'
                      : cancelled
                        ? 'xmark'
                        : type === 'show'
                          ? 'eye'
                          : 'clock'
                }
              />
              <span>{status}</span>
            </div>
            <div
              style={{
                marginTop: '0.4rem',
                fontSize: '1.2rem',
                color: '#617087'
              }}
            >
              <UsernameText
                displayedName={isFromMe ? 'You' : from.username}
                user={from}
              />{' '}
              {type === 'show'
                ? 'showed these items to'
                : type === 'send'
                  ? 'gave a gift to'
                  : 'proposed a trade with'}{' '}
              <UsernameText
                displayedName={to.id === userId ? 'you' : to.username}
                user={to}
              />
            </div>
          </div>
          <time
            dateTime={new Date(transaction.timeStamp * 1000).toISOString()}
            style={{ fontSize: '1.1rem', color: '#617087' }}
          >
            #{transaction.id} ·{' '}
            {new Date(transaction.timeStamp * 1000).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </time>
        </header>
        <div
          onClick={canOpen ? onClick : undefined}
          style={{ cursor: canOpen ? 'pointer' : undefined }}
        >
          <Exchange
            terms={terms}
            partnerName={partner.username}
            groupObjs={groupObjs}
            onInspectCard={onSetAICardModalCardId}
            showcase={type === 'show'}
            gift={type === 'send'}
            settled={settled}
            cancelled={cancelled}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginTop: '1.4rem',
            fontSize: '1.2rem',
            color: statusColor
          }}
          role={isOnModal ? 'status' : undefined}
        >
          <span>{statusNote}</span>
          {canOpen && (
            <Button color="logoBlue" variant="solid" onClick={onClick}>
              {type === 'send'
                ? 'View gift'
                : type === 'show' || requestOnly
                  ? 'View offer'
                  : 'Review offer'}
            </Button>
          )}
        </div>
      </article>
    </ErrorBoundary>
  );
}
