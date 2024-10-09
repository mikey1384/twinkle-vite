import { useEffect } from 'react';
import { socket } from '~/constants/sockets/api';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

export default function useAICardSocket() {
  const { userId, twinkleCoins } = useKeyContext((v) => v.myState);
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

    return function cleanUp() {
      socket.removeListener('ai_card_bought', handleAICardBought);
      socket.removeListener('ai_card_sold', handleAICardSold);
      socket.removeListener('ai_card_burned', handleAICardBurned);
      socket.removeListener('ai_card_listed', handleAICardListed);
      socket.removeListener('ai_card_delisted', handleAICardDelisted);
      socket.removeListener('ai_card_offer_posted', handleAICardOfferPosted);
      socket.removeListener('ai_card_offer_cancelled', handleAICardOfferCancel);
      socket.removeListener('assets_sent', handleAssetsSent);
      socket.removeListener(
        'current_transaction_id_updated',
        handleTransactionIdUpdate
      );
      socket.removeListener('new_ai_card_summoned', handleNewAICardSummon);
      socket.removeListener('transaction_accepted', handleTransactionAccept);
      socket.removeListener('transaction_cancelled', handleTransactionCancel);
    };

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

    function handleNewAICardSummon({ feed, card }: { feed: any; card: any }) {
      const senderIsNotTheUser = card.creator.id !== userId;
      if (senderIsNotTheUser) {
        onNewAICardSummon({ card, feed });
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
