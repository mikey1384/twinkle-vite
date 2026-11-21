import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  registerOpenTrade,
  requestTradeDeliverabilityRefresh
} from '../Trade/helpers/openTrades';
import UsernameText from '~/components/Texts/UsernameText';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { useReplyCardPresentation } from '../Message/MessageBody/ReplyCardPresentation';
import {
  batteryExpiresAtForOffer,
  formatBatteryExpiry
} from '~/helpers/battery';

export default function TransactionDetails({
  channelId,
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
  channelId?: number;
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
  const inReply = useReplyCardPresentation();
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const onCancelTransaction = useChatContext(
    (v) => v.actions.onCancelTransaction
  );
  const onUpdateCurrentTransactionId = useChatContext(
    (v) => v.actions.onUpdateCurrentTransactionId
  );
  const closeTransaction = useAppContext(
    (v) => v.requestHelpers.closeTransaction
  );
  const [declining, setDeclining] = useState(false);
  const decliningRef = useRef(false);
  const [declineError, setDeclineError] = useState('');
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
  // The server's latest verdict for this open offer, refreshed while the card
  // is on screen; the page load's verdict until then.
  const liveDeliverability = useChatContext(
    (v) => v.state.tradeDeliverability?.[transaction.id]
  );
  // An offer's battery belongs to the site day it was made on. One timer for
  // that day's end re-renders the card, so it reads "Offer expired" at the
  // boundary without a request.
  const offerHasBattery =
    Number(transaction?.offer?.battery) > 0 ||
    Number(transaction?.want?.battery) > 0;
  const batteryExpiresAt = offerHasBattery
    ? batteryExpiresAtForOffer(Number(transaction.timeStamp))
    : 0;
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (!batteryExpiresAt) return;
    // A card React reuses for another offer (or one remounted long after it
    // first rendered) must never judge its date with the previous clock:
    // take the time now whenever the offer's day changes, then wake once at
    // that day's end.
    setNowMs(Date.now());
    const wait = batteryExpiresAt * 1000 - Date.now();
    if (wait <= 0) return;
    // setTimeout holds at most ~24.8 days; a site day is shorter
    const timer = setTimeout(() => setNowMs(Date.now()), wait + 500);
    return () => clearTimeout(timer);
  }, [batteryExpiresAt]);
  const judgedTransaction = useMemo(
    () =>
      liveDeliverability
        ? { ...transaction, deliverability: liveDeliverability }
        : transaction,
    [liveDeliverability, transaction]
  );
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
    closed,
    expired,
    expiredReason,
    requestOnly
  } = getTradeStatus({
    transaction: judgedTransaction,
    viewerId: userId,
    isAccepted: !!isAccepted,
    isCancelled,
    cancelReason,
    isCurrent: transaction.id === currentTransactionId,
    nowMs
  });
  const isOpenTrade =
    type === 'trade' && !isAccepted && !closed && !requestOnly;
  useEffect(() => {
    if (!isOpenTrade) return;
    const unregister = registerOpenTrade(transaction.id);
    requestTradeDeliverabilityRefresh();
    return unregister;
  }, [isOpenTrade, transaction.id]);
  const responsibleName =
    Number(judgedTransaction?.deliverability?.responsibleUserId) ===
    Number(userId)
      ? 'You'
      : partner?.username || 'Your partner';
  const missingThing: Record<string, string> = {
    'not enough coins': 'the coins',
    'not enough battery': 'the battery',
    'changed card ownership': 'a card',
    'card burned': 'a card',
    'card unavailable': 'a card',
    'changed group ownership': 'a group',
    'classes not allowed': 'a group',
    'changed app ownership': 'an app'
  };
  const expiredNote =
    expiredReason === 'battery day passed'
      ? 'The battery in this offer was for a day that has ended. Nothing moved.'
      : `${responsibleName} no longer ${
          responsibleName === 'You' ? 'have' : 'has'
        } ${missingThing[expiredReason || ''] || 'everything'} in this offer. Nothing moved.`;
  const statusNote =
    type === 'show'
      ? 'Nothing changes owners.'
      : type === 'send'
        ? 'A gift, with nothing in return.'
        : isAccepted
          ? 'All items have changed owners.'
          : expired
            ? expiredNote
            : cancelled
            ? 'Nothing moved.'
            : requestOnly
              ? 'No offer has been made. Nothing changes owners.'
              : 'Nothing moves until this offer is accepted.';
  // An expired offer is still open on the server: the receiver can decline it
  // to clear the chat's current offer, and either side can open it.
  const canOpen =
    !isOnModal && !!onClick && (!settled || type === 'send') && !closed;
  // The receiver can say no right on the card (Mikey 10-12): with only one
  // primary button, members took "Review offer" for "accept" and hesitated.
  const canDecline =
    canOpen &&
    !!channelId &&
    type === 'trade' &&
    !isFromMe &&
    Number(transaction.to) === Number(userId);
  const statusColor = settled ? '#126b65' : cancelled ? '#5a677d' : '#315b91';
  const transactionDate = new Date(Number(transaction.timeStamp) * 1000);
  const hasTransactionDate = transaction.timeStamp != null &&
    Number.isFinite(transactionDate.getTime());
  const statusIcon =
    type === 'send'
      ? 'gift'
      : isAccepted
        ? 'check'
        : expired
          ? 'hourglass-end'
          : cancelled
          ? 'xmark'
          : type === 'show'
            ? 'eye'
            : requestOnly
              ? 'eye'
              : 'clock';
  // The result also closes the card (Mikey 10-12): after scrolling through the
  // items, whether it went through is right there, not only in the header.
  const resultBackground = settled
    ? '#e9f6f3'
    : cancelled
      ? '#f1f3f6'
      : '#edf3fb';

  return (
    <ErrorBoundary componentPath="Chat/TransactionDetails">
      <article
        className={css`
          width: 100%;
          min-width: 0;
          ${!isOnModal ? `max-width: 72rem; margin: ${inReply ? '0' : '1.4rem auto'}; padding: ${inReply ? '1rem' : '1.6rem'}; border: 1px solid #dce4ee; border-radius: ${inReply ? '1rem' : '1.6rem'}; background: #fff; ${inReply ? '' : 'box-shadow: 0 3px 12px #203c6008;'}` : ''}
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
            marginBottom: inReply ? '0.8rem' : '1.4rem'
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
              <Icon icon={statusIcon} />
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
                  : requestOnly
                    ? 'showed interest in'
                    : 'proposed a trade with'}{' '}
              {requestOnly && to.id === userId ? (
                'your items'
              ) : (
                <>
                  <UsernameText
                    displayedName={to.id === userId ? 'you' : to.username}
                    user={to}
                  />
                  {requestOnly ? "'s items" : ''}
                </>
              )}
            </div>
          </div>
          {!settled && !cancelled && batteryExpiresAt > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '99rem',
                background: '#fff8ed',
                border: '1px solid #ebc896',
                color: '#80501c',
                fontSize: '1.15rem',
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}
            >
              <Icon icon="hourglass-half" />
              Expires {formatBatteryExpiry(batteryExpiresAt, nowMs)}
            </span>
          )}
          <time
            dateTime={hasTransactionDate ? transactionDate.toISOString() : undefined}
            style={{ fontSize: '1.1rem', color: '#617087' }}
          >
            #{transaction.id}
            {hasTransactionDate && ` · ${transactionDate.toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}`}
          </time>
        </header>
        <div
          data-quote-own-click={canOpen ? '' : undefined}
          onClick={canOpen ? onClick : undefined}
          style={{ cursor: canOpen ? 'pointer' : undefined }}
        >
          <Exchange
            terms={terms}
            partnerName={partner.username}
            groupObjs={groupObjs}
            onInspectCard={onSetAICardModalCardId}
            interest={requestOnly ? normalizeBundle(want) : undefined}
            showcase={type === 'show'}
            gift={type === 'send'}
            settled={settled}
            cancelled={cancelled}
            batteryExpiresAt={batteryExpiresAt}
            batteryState={
              expired
                ? 'expired'
                : cancelled
                  ? 'cancelled'
                  : settled
                    ? 'received'
                    : 'listed'
            }
            nowMs={nowMs}
          />
        </div>
        <div
          className={css`
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1rem;
            margin-top: ${inReply ? '0.8rem' : '1.4rem'};
            padding: ${inReply ? '0.8rem 1rem' : '1rem 1.2rem'};
            border-radius: 1.2rem;
            background: ${resultBackground};
            color: ${statusColor};
          `}
          role={isOnModal ? 'status' : undefined}
        >
          <div
            className={css`
              display: flex;
              align-items: flex-start;
              gap: 0.8rem;
              min-width: 0;
              flex: 1 1 18rem;
            `}
          >
            <Icon
              icon={statusIcon}
              style={{ fontSize: '1.5rem', marginTop: '0.2rem' }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                {status}
              </div>
              <div style={{ fontSize: '1.2rem', marginTop: '0.2rem' }}>
                {statusNote}
              </div>
            </div>
          </div>
          {canOpen && (
            <div
              className={css`
                display: flex;
                flex-wrap: wrap;
                gap: 0.8rem;
                margin-left: auto;
              `}
            >
              {canDecline && (
                <Button
                  color="darkerGray"
                  variant="outline"
                  loading={declining}
                  onClick={handleDecline}
                >
                  <Icon icon="xmark" />
                  <span style={{ marginLeft: '0.6rem' }}>
                    {requestOnly ? 'Not interested' : 'Decline'}
                  </span>
                </Button>
              )}
              <Button
                color="logoBlue"
                variant="solid"
                disabled={declining}
                onClick={onClick}
              >
                {type === 'send'
                  ? 'View gift'
                  : requestOnly
                    ? 'View interest'
                    : type === 'show'
                      ? 'View offer'
                      : 'Review offer'}
              </Button>
            </div>
          )}
          {declineError && (
            <p
              role="alert"
              style={{
                width: '100%',
                margin: 0,
                color: '#a12235',
                fontSize: '1.2rem'
              }}
            >
              {declineError}
            </p>
          )}
        </div>
      </article>
    </ErrorBoundary>
  );

  async function handleDecline() {
    if (!channelId || decliningRef.current) return;
    decliningRef.current = true;
    try {
      setDeclining(true);
      setDeclineError('');
      const result = await closeTransaction({
        channelId,
        transactionId: transaction.id,
        cancelReason: 'decline'
      });
      if (
        !result?.channelId ||
        !result?.transactionId ||
        !result.cancelReason
      ) {
        throw new Error('Missing confirmed transaction result');
      }
      // the server broadcasts this too; applying it here makes the card
      // settle at once even if the socket is slow
      onCancelTransaction({
        transactionId: result.transactionId,
        reason: result.cancelReason
      });
      onUpdateCurrentTransactionId({
        channelId: result.channelId,
        transactionId: null
      });
    } catch (error: any) {
      setDeclineError(
        error?.response?.data?.error ||
          'This offer could not be declined. Please try again.'
      );
    } finally {
      decliningRef.current = false;
      setDeclining(false);
    }
  }
}
