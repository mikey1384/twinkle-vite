import React, { useState } from 'react';
import CardItem from './CardItem';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function Main({
  cards,
  filters,
  isBuy,
  loading,
  loadMoreShown,
  loadFilteredAICards,
  selectedCardIds,
  successColor,
  onSetCardIds,
  onSetLoadMoreShown,
  onSetSelectedCardIds,
  onSetAICardModalCardId,
  onUpdateAICard
}: {
  cards: any[];
  filters: Record<string, any>;
  isBuy: boolean;
  loading: boolean;
  loadFilteredAICards: (v: any) => any;
  selectedCardIds: any[];
  successColor: string;
  loadMoreShown: boolean;
  onSetCardIds: (v: any) => any;
  onSetLoadMoreShown: (v: any) => any;
  onSetSelectedCardIds: (v: any) => any;
  onSetAICardModalCardId: (v: any) => any;
  onUpdateAICard: (v: any) => any;
}) {
  const [loadingMore, setLoadingMore] = useState(false);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
      {loading ? (
        <Loading />
      ) : cards.length ? (
        cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            isBuy={isBuy}
            selected={selectedCardIds.includes(card.id)}
            onSelect={() =>
              onSetSelectedCardIds((prevIds: { id: number }[]) => [
                ...prevIds,
                card.id
              ])
            }
            onDeselect={() =>
              onSetSelectedCardIds((prevIds: { id: number }[]) =>
                prevIds.filter((id) => id !== card.id)
              )
            }
            successColor={successColor}
            onSetAICardModalCardId={onSetAICardModalCardId}
          />
        ))
      ) : (
        <div
          style={{
            width: '100%',
            height: '20rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div
            className={css`
              font-weight: bold;
              font-size: 1.7rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.5rem;
              }
            `}
          >
            There are no cards
          </div>
        </div>
      )}
      {loadMoreShown && (
        <LoadMoreButton
          style={{ marginTop: '1.5em' }}
          loading={loadingMore}
          filled
          onClick={handleLoadMore}
        />
      )}
    </div>
  );

  async function handleLoadMore() {
    const lastCard = cards[cards.length - 1];
    let lastInteraction, lastPrice, lastId;
    if (filters.isBuyNow) {
      lastPrice = lastCard.askPrice;
      lastId = lastCard.id;
    } else {
      lastInteraction = lastCard.lastInteraction;
      lastId = lastCard.id;
    }
    setLoadingMore(true);
    const { cards: newCards, loadMoreShown } = await loadFilteredAICards({
      lastInteraction,
      lastPrice,
      lastId,
      filters,
      excludeMyCards: isBuy
    });
    for (const card of newCards) {
      onUpdateAICard({ cardId: card.id, newState: card });
    }
    onSetCardIds((prevCardIds: number[]) => [
      ...prevCardIds,
      ...newCards.map((card: { id: number }) => card.id)
    ]);
    onSetLoadMoreShown(loadMoreShown);
    setLoadingMore(false);
  }
}
