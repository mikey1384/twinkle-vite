import { useEffect, useRef } from 'react';
import { socket } from '~/constants/sockets/api';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

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
  const onAICardOfferWithdrawal = useChatContext(
    (v) => v.actions.onAICardOfferWithdrawal
  );
  const onCancelTransaction = useChatContext(
    (v) => v.actions.onCancelTransaction
  );
  const onDelistAICard = useChatContext((v) => v.actions.onDelistAICard);
  const onMakeOutgoingOffer = useChatContext(
    (v) => v.actions.onMakeOutgoingOffer
  );
  const onNewAICardSummon = useChatContext((v) => v.actions.onNewAICardSummon);
  const onPostAICardFeed = useChatContext((v) => v.actions.onPostAICardFeed);
  const onRemoveMyAICard = useChatContext((v) => v.actions.onRemoveMyAICard);
  const onRemoveListedAICard = useChatContext(
    (v) => v.actions.onRemoveListedAICard
  );
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
      const rawId = status?.cardId;
      const cardId = typeof rawId === 'string' ? Number(rawId) : rawId;
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

      const hasPartial = !!status?.partialImageB64;
      const rawImageUrl: string | undefined = status?.imageUrl;
      const rawImagePath: string | undefined = status?.imagePath;
      const isDataUrl =
        typeof rawImageUrl === 'string' && rawImageUrl.startsWith('data:');

      const hasActualImagePath =
        !!rawImagePath || (!!rawImageUrl && !isDataUrl);

      const inProgress =
        activeStages.has(stage) ||
        (stage === 'completed' && !hasActualImagePath);

      const previewUrl = hasPartial
        ? `data:image/png;base64,${status.partialImageB64}`
        : !inProgress && stage === 'completed'
        ? ''
        : rawImageUrl || '';

      const newState: Record<string, any> = {
        imageGenerationStage: stage,
        imageGenerationInProgress: inProgress
      };

      if (stage === 'completed') {
        const finalImagePath = rawImagePath || (isDataUrl ? '' : rawImageUrl);
        if (finalImagePath && !finalImagePath.startsWith('data:')) {
          newState.imagePath = normalizeToPath(finalImagePath);
          newState.imageGenerationPreviewUrl = '';
        } else if (isDataUrl && rawImageUrl) {
          newState.imageGenerationPreviewUrl = rawImageUrl;
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
        newState: card
      });
      onPostAICardFeed({
        feed,
        card
      });
      if (buyerId === currentUserId) {
        onAddMyAICard(card);
      }
      if (sellerId === currentUserId) {
        onDelistAICard(card.id);
        onRemoveMyAICard(card.id);
        onSetUserState({ userId: currentUserId, newState: { twinkleCoins: sellerCoins } });
      }
    }

    async function handleAICardBurned(cardId: number) {
      onUpdateAICard({ cardId, newState: { isBurning: true } });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      onUpdateAICard({
        cardId,
        newState: {
          isBurned: true
        }
      });
    }

    function handleAICardDelisted(cardId: number) {
      onRemoveListedAICard(cardId);
    }

    function handleAICardListed(card: any) {
      if (card.ownerId !== userIdRef.current) {
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
        onAddMyAICard(card);
      }
      if (sellerId === currentUserId) {
        onDelistAICard(card.id);
        onRemoveMyAICard(card.id);
      }
      onRemoveListedAICard(card.id);
      onUpdateAICard({
        cardId: card.id,
        newState: card
      });
      onPostAICardFeed({
        feed,
        card
      });
    }

    function handleAssetsSent({
      cards,
      coins,
      from,
      to
    }: {
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
        if (from === currentUserId) {
          onDelistAICard(card.id);
          onRemoveMyAICard(card.id);
        }
        if (to === currentUserId) {
          onAddMyAICard(card);
        }
        onUpdateAICard({
          cardId: card.id,
          newState: { id: card.id, ownerId: to }
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
      isBlack
    }: {
      feed: any;
      card: any;
      isBlack: boolean;
    }) {
      const senderIsNotTheUser = card.creator.id !== userIdRef.current;
      if (senderIsNotTheUser) {
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
