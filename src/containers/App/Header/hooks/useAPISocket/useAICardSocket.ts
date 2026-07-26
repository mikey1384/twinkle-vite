import { useEffect, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { queueCanonicalAICardBurnTransition } from '~/helpers/aiCardBurnTransition';
import {
  getConfirmedAICardDirectTransferState,
  getConfirmedAICardImageState,
  getConfirmedAICardImageTerminalState,
  getConfirmedAICardTransferState,
  normalizeAICardId
} from '~/helpers/aiCardCanonicalUpdates';
import type { Card } from '~/types';

export default function useAICardSocket() {
  const userId = useKeyContext((v) => v.myState.userId);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);

  const userIdRef = useRef(userId);
  const twinkleCoinsRef = useRef(twinkleCoins);
  userIdRef.current = userId;
  twinkleCoinsRef.current = twinkleCoins;
  const onAcceptTransaction = useChatContext(
    (v) => v.actions.onAcceptTransaction
  );
  const onAddMyAICard = useChatContext((v) => v.actions.onAddMyAICard);
  const onAddListedAICard = useChatContext((v) => v.actions.onAddListedAICard);
  const onApplyAICardDirectTransfer = useChatContext(
    (v) => v.actions.onApplyAICardDirectTransfer
  );
  const onAICardOfferWithdrawal = useChatContext(
    (v) => v.actions.onAICardOfferWithdrawal
  );
  const onCancelTransaction = useChatContext(
    (v) => v.actions.onCancelTransaction
  );
  const onDelistAICard = useChatContext((v) => v.actions.onDelistAICard);
  const onListAICard = useChatContext((v) => v.actions.onListAICard);
  const onMakeOutgoingOffer = useChatContext(
    (v) => v.actions.onMakeOutgoingOffer
  );
  const onNewAICardSummon = useChatContext((v) => v.actions.onNewAICardSummon);
  const onPostAICardFeed = useChatContext((v) => v.actions.onPostAICardFeed);
  const onUpdateNumSummoned = useChatContext(
    (v) => v.actions.onUpdateNumSummoned
  );
  const onRemoveMyAICard = useChatContext((v) => v.actions.onRemoveMyAICard);
  const onRemoveListedAICard = useChatContext(
    (v) => v.actions.onRemoveListedAICard
  );
  const loadAICard = useAppContext((v) => v.requestHelpers.loadAICard);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const onUpdateCurrentTransactionId = useChatContext(
    (v) => v.actions.onUpdateCurrentTransactionId
  );
  const onUpdateMostRecentAICardOfferTimeStamp = useChatContext(
    (v) => v.actions.onUpdateMostRecentAICardOfferTimeStamp
  );
  const onWithdrawOutgoingOffer = useChatContext(
    (v) => v.actions.onWithdrawOutgoingOffer
  );
  const onSetAICardStatusMessage = useChatContext(
    (v) => v.actions.onSetAICardStatusMessage
  );
  const onInsertBlackAICardUpdateLog = useChatContext(
    (v) => v.actions.onInsertBlackAICardUpdateLog
  );

  useEffect(() => {
    socket.on('ai_card_bought', handleAICardBought);
    socket.on('ai_card_sold', handleAICardSold);
    socket.on('ai_card_burned', handleAICardBurned);
    socket.on('ai_card_listed', handleAICardListed);
    socket.on('ai_card_delisted', handleAICardDelisted);
    socket.on('ai_card_offer_posted', handleAICardOfferPosted);
    socket.on('ai_card_offer_cancelled', handleAICardOfferCancel);
    socket.on('assets_sent', handleAssetsSent);
    socket.on('current_transaction_id_updated', handleTransactionIdUpdate);
    socket.on('new_ai_card_summoned', handleNewAICardSummon);
    socket.on('transaction_accepted', handleTransactionAccept);
    socket.on('transaction_cancelled', handleTransactionCancel);
    socket.on('new_ai_card_generation_status', onSetAICardStatusMessage);
    socket.on(
      'new_black_ai_card_generation_status',
      onInsertBlackAICardUpdateLog
    );
    socket.on(
      'ai_card_image_generation_status_received',
      handleAICardImageStatus
    );

    return function cleanUp() {
      socket.off('ai_card_bought', handleAICardBought);
      socket.off('ai_card_sold', handleAICardSold);
      socket.off('ai_card_burned', handleAICardBurned);
      socket.off('ai_card_listed', handleAICardListed);
      socket.off('ai_card_delisted', handleAICardDelisted);
      socket.off('ai_card_offer_posted', handleAICardOfferPosted);
      socket.off('ai_card_offer_cancelled', handleAICardOfferCancel);
      socket.off('assets_sent', handleAssetsSent);
      socket.off('current_transaction_id_updated', handleTransactionIdUpdate);
      socket.off('new_ai_card_summoned', handleNewAICardSummon);
      socket.off('transaction_accepted', handleTransactionAccept);
      socket.off('transaction_cancelled', handleTransactionCancel);
      socket.off('new_ai_card_generation_status', onSetAICardStatusMessage);
      socket.off(
        'new_black_ai_card_generation_status',
        onInsertBlackAICardUpdateLog
      );
      socket.off(
        'ai_card_image_generation_status_received',
        handleAICardImageStatus
      );
    };

    function handleAICardImageStatus(status: any) {
      const cardId = normalizeAICardId(status?.cardId);
      if (!cardId) return;

      const stage = status?.stage as
        | 'not_started'
        | 'validating_style'
        | 'prompt_ready'
        | 'calling_openai'
        | 'in_progress'
        | 'generating'
        | 'partial_image'
        | 'downloading'
        | 'uploading'
        | 'completed'
        | 'error';
      const canonicalCard: Record<string, unknown> | undefined =
        (stage === 'completed' || stage === 'error') &&
        normalizeAICardId(status?.card?.id) === cardId
          ? status.card
          : undefined;
      const canonicalTerminalState =
        (stage === 'completed' || stage === 'error') && canonicalCard
          ? getConfirmedAICardImageTerminalState({
              card: canonicalCard,
              stage
            })
          : null;
      if (canonicalTerminalState) {
        onUpdateAICard({ cardId, newState: canonicalTerminalState });
        return;
      }
      const canonicalImageState = canonicalCard
        ? getConfirmedAICardImageState(canonicalCard)
        : undefined;

      const activeStages = new Set([
        'validating_style',
        'prompt_ready',
        'calling_openai',
        'in_progress',
        'generating',
        'partial_image',
        'downloading',
        'uploading'
      ]);

      function isGeneratingImagePath(path?: string) {
        if (typeof path !== 'string') return false;
        const normalized = path.trim().toLowerCase();
        return /^generating\.{0,3}$/.test(normalized);
      }

      const hasPartial = !!status?.partialImageB64;
      const rawImageUrl: string | undefined = status?.imageUrl;
      const canonicalImagePath = canonicalImageState?.imagePath;
      const rawImagePath: string | undefined =
        status?.imagePath ||
        (typeof canonicalImagePath === 'string'
          ? canonicalImagePath
          : undefined);
      const isDataUrl =
        typeof rawImageUrl === 'string' && rawImageUrl.startsWith('data:');

      const hasValidImagePath =
        typeof rawImagePath === 'string' &&
        !!rawImagePath &&
        !isGeneratingImagePath(rawImagePath);
      const hasValidImageUrl =
        typeof rawImageUrl === 'string' &&
        !!rawImageUrl &&
        !isDataUrl &&
        !isGeneratingImagePath(rawImageUrl);

      const hasActualImagePath = hasValidImagePath || hasValidImageUrl;
      const canonicalGenerationStillRunning =
        canonicalImageState?.isImageGenerating === true;

      const inProgress =
        activeStages.has(stage) ||
        (stage === 'completed' && !hasActualImagePath) ||
        (stage === 'error' && canonicalGenerationStillRunning);

      const previewUrl = hasPartial
        ? `data:image/png;base64,${status.partialImageB64}`
        : !inProgress && stage === 'completed'
        ? ''
        : rawImageUrl || '';

      const newState: Record<string, any> = {
        ...(canonicalImageState || {}),
        imageGenerationStage: stage,
        imageGenerationInProgress: inProgress,
        isImageGenerating: inProgress
      };

      if (stage === 'completed') {
        if (canonicalCard) {
          newState.imageGenerationPreviewUrl = '';
        } else {
          const finalImagePath = rawImagePath || (isDataUrl ? '' : rawImageUrl);
          if (
            finalImagePath &&
            !finalImagePath.startsWith('data:') &&
            !isGeneratingImagePath(finalImagePath)
          ) {
            newState.imagePath = normalizeToPath(finalImagePath);
            newState.imageGenerationPreviewUrl = '';
            // Backward compatibility for servers that predate the canonical
            // completion payload. Commit only fields confirmed by that server.
            if (typeof status?.engine === 'string' && status.engine) {
              newState.engine = status.engine;
            }
          } else if (isDataUrl && rawImageUrl) {
            newState.imageGenerationPreviewUrl = rawImageUrl;
          }
        }
      } else if (previewUrl) {
        newState.imageGenerationPreviewUrl = previewUrl;
      } else if (stage === 'error') {
        newState.imageGenerationPreviewUrl = '';
      }
      onUpdateAICard({ cardId, newState });
    }

    function normalizeToPath(url: string): string {
      if (!url) return '';
      if (
        typeof url === 'string' &&
        /^generating\.{0,3}$/i.test(url.trim())
      ) {
        return '';
      }

      if (url.startsWith('/')) return url;

      if (url.startsWith('data:')) return '';
      try {
        const u = new URL(url);
        const path = u.pathname + (u.search || '');
        return path.startsWith('/') ? path : `/${path}`;
      } catch {
        return url.startsWith('/') ? url : `/${url}`;
      }
    }

    async function handleAICardBought({
      feed,
      card,
      sellerCoins,
      buyerId,
      sellerId
    }: {
      feed: any;
      card: any;
      sellerCoins: number;
      buyerId: number;
      sellerId: number;
    }) {
      const currentUserId = userIdRef.current;
      onRemoveListedAICard(card.id);
      onUpdateAICard({
        cardId: card.id,
        initialState: card,
        newState: getConfirmedAICardTransferState(card)
      });
      onPostAICardFeed({
        feed,
        card
      });
      if (buyerId === currentUserId) {
        onAddMyAICard({
          id: card.id,
          ...getConfirmedAICardTransferState(card)
        });
      }
      if (sellerId === currentUserId) {
        onDelistAICard(card.id);
        onRemoveMyAICard(card.id);
        onSetUserState({ userId: currentUserId, newState: { twinkleCoins: sellerCoins } });
      }
    }

    async function handleAICardBurned(
      rawCardId: number | string,
      burnedCard?: Card
    ) {
      const cardId = normalizeAICardId(rawCardId);
      if (!cardId) return;
      const confirmedBurnedCard =
        normalizeAICardId(burnedCard?.id) === cardId
          ? burnedCard
          : undefined;
      const canonicalCard = confirmedBurnedCard
        ? confirmedBurnedCard
        : await loadAICard(cardId)
            .then((result: { card?: Card } | undefined) => result?.card)
            .catch((error: unknown) => {
              console.error(error);
              return undefined;
            });
      if (
        queueCanonicalAICardBurnTransition({
          cardId,
          card: canonicalCard,
          onUpdateAICard
        })
      ) {
        return;
      }
      // The event itself confirms the burn even if an older server omits the
      // card and the compatibility refetch fails. Do not synthesize any other
      // canonical card fields in that degraded path.
      onUpdateAICard({
        cardId,
        newState: { isBurned: true, isBurning: false }
      });
    }

    function handleAICardDelisted(cardId: number, card?: any) {
      onRemoveListedAICard(cardId);
      if (Number(card?.id) === Number(cardId)) {
        onListAICard({ card });
      } else {
        onDelistAICard(cardId);
      }
    }

    function handleAICardListed(card: any) {
      if (card.ownerId === userIdRef.current) {
        onListAICard({ card });
      } else {
        onAddListedAICard(card);
      }
    }

    function handleAICardOfferCancel({
      cardId,
      coins,
      feedId,
      offerId,
      offererId
    }: {
      cardId: number;
      coins: number;
      feedId: number;
      offerId: number;
      offererId: number;
    }) {
      const currentUserId = userIdRef.current;
      onAICardOfferWithdrawal(feedId);
      if (offererId === currentUserId) {
        onWithdrawOutgoingOffer(offerId);
        onSetUserState({ userId: currentUserId, newState: { twinkleCoins: coins } });
        onUpdateAICard({ cardId, newState: { myOffer: null } });
      }
    }

    function handleAICardOfferPosted({ card, feed }: { card: any; feed: any }) {
      const currentUserId = userIdRef.current;
      onPostAICardFeed({
        feed,
        card
      });
      if (card.ownerId === currentUserId) {
        onUpdateMostRecentAICardOfferTimeStamp(feed.timeStamp);
      }
      if (feed.offer?.user?.id === currentUserId) {
        onMakeOutgoingOffer({ ...feed.offer, card });
        onUpdateAICard({
          cardId: card.id,
          newState: { myOffer: feed.offer }
        });
      }
    }

    async function handleAICardSold({
      feed,
      card,
      offerId,
      sellerId
    }: {
      feed: any;
      card: any;
      offerId: number;
      sellerId: number;
    }) {
      const currentUserId = userIdRef.current;
      if (card.ownerId === currentUserId) {
        onWithdrawOutgoingOffer(offerId);
        onAddMyAICard({
          id: card.id,
          ...getConfirmedAICardTransferState(card)
        });
      }
      if (sellerId === currentUserId) {
        onDelistAICard(card.id);
        onRemoveMyAICard(card.id);
      }
      onRemoveListedAICard(card.id);
      onUpdateAICard({
        cardId: card.id,
        initialState: card,
        newState: getConfirmedAICardTransferState(card)
      });
      onPostAICardFeed({
        feed,
        card
      });
    }

    function handleAssetsSent({
      aiCardPayloadVersion,
      cards,
      coins,
      from,
      to
    }: {
      aiCardPayloadVersion?: number;
      cards: any;
      coins: number;
      from: number;
      to: number;
    }) {
      const currentUserId = userIdRef.current;
      const currentTwinkleCoins = twinkleCoinsRef.current;
      if (from === currentUserId && !!coins) {
        onSetUserState({
          userId: currentUserId,
          newState: { twinkleCoins: currentTwinkleCoins - coins }
        });
      }
      if (to === currentUserId && !!coins) {
        onSetUserState({
          userId: currentUserId,
          newState: { twinkleCoins: currentTwinkleCoins + coins }
        });
      }
      for (const card of cards) {
        const cardId = normalizeAICardId(card?.id);
        if (!cardId) continue;
        const confirmedTransferState =
          getConfirmedAICardDirectTransferState({
            aiCardPayloadVersion,
            card,
            ownerId: to
          });
        const confirmedCard = {
          ...card,
          ...confirmedTransferState,
          id: cardId
        };
        onApplyAICardDirectTransfer({
          card: confirmedCard,
          newState: confirmedTransferState,
          userId: currentUserId
        });
      }
    }

    function handleTransactionIdUpdate({
      channelId,
      senderId,
      transactionId
    }: {
      channelId: number;
      senderId: number;
      transactionId: number;
    }) {
      if (senderId !== userIdRef.current) {
        onUpdateCurrentTransactionId({ channelId, transactionId });
      }
    }

    function handleNewAICardSummon({
      feed,
      card,
      summonerId,
      numCardSummoned,
      isBlack
    }: {
      feed: any;
      card: any;
      summonerId?: number;
      numCardSummoned?: number;
      isBlack: boolean;
    }) {
      // The summoner used to be skipped here because the summon response adds
      // the card itself. That made the response the only way they could ever
      // see their own card: when it failed, everyone else in the room watched
      // the card appear and the person who summoned it did not. Both paths run
      // now — POST_AI_CARD_FEED filters the feed and card ids before prepending,
      // so whichever arrives second is a no-op.
      const summonedByThisUser =
        (summonerId ?? card.creator?.id) === userIdRef.current;
      if (summonedByThisUser) {
        // The response path also maintains myCardIds, which RECEIVE_AI_CARD_SUMMON
        // does not — the summoner has to go through the same action it does.
        onPostAICardFeed({ feed, card, isSummon: true });
        if (typeof numCardSummoned === 'number') {
          onUpdateNumSummoned(numCardSummoned);
        }
      } else {
        onNewAICardSummon({ card, feed });
      }
      if (isBlack) {
        onInsertBlackAICardUpdateLog('Black AI Card Summoned');
      }
    }

    function handleTransactionAccept({
      transactionId
    }: {
      transactionId: number;
    }) {
      onAcceptTransaction({ transactionId });
    }

    function handleTransactionCancel({
      transactionId,
      cancelReason
    }: {
      transactionId: number;
      cancelReason: string;
    }) {
      onCancelTransaction({ transactionId, reason: cancelReason });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
