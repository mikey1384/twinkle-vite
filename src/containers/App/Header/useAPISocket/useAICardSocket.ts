import { useEffect } from 'react';
import { socket } from '~/constants/sockets/api';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

export default function useAICardSocket() {
  const userId = useKeyContext((v) => v.myState.userId);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
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

      const inProgress = activeStages.has(stage);
      // Only use preview while generation is active. When completed with a final URL,
      // persist it to imagePath instead so it shows everywhere.
      const hasPartial = !!status?.partialImageB64;
      const rawImageUrl: string | undefined = status?.imageUrl;
      const previewUrl = hasPartial
        ? `data:image/png;base64,${status.partialImageB64}`
        : !inProgress && stage === 'completed'
        ? ''
        : rawImageUrl || '';

      const newState: Record<string, any> = {
        imageGenerationStage: stage,
        imageGenerationInProgress: inProgress
      };

      // For completed events, the server currently sends a data URL (base64) for
      // imageUrl while the actual CDN path is returned via the HTTP response.
      // Avoid setting imagePath from a data URI (which would clear it to '').
      if (stage === 'completed' && rawImageUrl) {
        const isDataUrl = typeof rawImageUrl === 'string' && rawImageUrl.startsWith('data:');
        if (!isDataUrl) {
          // Normalize to a path so non-modal card renders (which prefix CloudFront) work.
          newState.imagePath = normalizeToPath(rawImageUrl);
          newState.imageGenerationPreviewUrl = '';
        } else {
          // Keep showing the final base64 in the preview location until the
          // HTTP response updates imagePath to the CDN path.
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
      // If already a relative path, ensure it starts with '/'
      if (url.startsWith('/')) return url;
      // Do not ever persist data URIs as imagePath
      if (url.startsWith('data:')) return '';
      try {
        const u = new URL(url);
        const path = u.pathname + (u.search || '');
        return path.startsWith('/') ? path : `/${path}`;
      } catch {
        // Fallback: best-effort to make it a path
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
      onRemoveListedAICard(card.id);
      onUpdateAICard({
        cardId: card.id,
        newState: card
      });
      onPostAICardFeed({
        feed,
        card
      });
      if (buyerId === userId) {
        onAddMyAICard(card);
      }
      if (sellerId === userId) {
        onDelistAICard(card.id);
        onRemoveMyAICard(card.id);
        onSetUserState({ userId, newState: { twinkleCoins: sellerCoins } });
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
      if (card.ownerId !== userId) {
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
      onAICardOfferWithdrawal(feedId);
      if (offererId === userId) {
        onWithdrawOutgoingOffer(offerId);
        onSetUserState({ userId, newState: { twinkleCoins: coins } });
        onUpdateAICard({ cardId, newState: { myOffer: null } });
      }
    }

    function handleAICardOfferPosted({ card, feed }: { card: any; feed: any }) {
      onPostAICardFeed({
        feed,
        card
      });
      if (card.ownerId === userId) {
        onUpdateMostRecentAICardOfferTimeStamp(feed.timeStamp);
      }
      if (feed.offer?.user?.id === userId) {
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
      if (card.ownerId === userId) {
        onWithdrawOutgoingOffer(offerId);
        onAddMyAICard(card);
      }
      if (sellerId === userId) {
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
      if (from === userId && !!coins) {
        onSetUserState({
          userId,
          newState: { twinkleCoins: twinkleCoins - coins }
        });
      }
      if (to === userId && !!coins) {
        onSetUserState({
          userId,
          newState: { twinkleCoins: twinkleCoins + coins }
        });
      }
      for (const card of cards) {
        if (from === userId) {
          onDelistAICard(card.id);
          onRemoveMyAICard(card.id);
        }
        if (to === userId) {
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
      if (senderId !== userId) {
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
      const senderIsNotTheUser = card.creator.id !== userId;
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
  });
}
