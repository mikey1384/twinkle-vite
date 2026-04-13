import React, { useRef, useState } from 'react';
import CardItem from './CardItem';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function Main({
  aiCardModalType,
  cards,
  loading,
  loadMoreShown,
  loadFilteredAICards,
  myUsername,
  partnerName,
  selectedCardIds,
  successColor,
  onSetCardIds,
  onSetLoadMoreShown,
  onSetSelectedCardIds,
  onSetAICardModalCardId,
  onUpdateAICard
}: {
  aiCardModalType: string;
  cards: any[];
  loading: boolean;
  loadFilteredAICards: (v: any) => any;
  myUsername: string;
  partnerName: string;
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
  const loadingMoreRef = useRef(false);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
      {loading ? (
        <Loading />
      ) : cards.length ? (
        cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
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
            {aiCardModalType === 'want'
              ? `${partnerName} does not own any`
              : `You don't own any`}{' '}
            cards
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
    if (loadingMoreRef.current) return;
    const lastCard = cards[cards.length - 1];
    const lastInteraction = lastCard?.lastInteraction;
    const lastId = lastCard?.id;
    if (!lastInteraction || !lastId) {
      onSetLoadMoreShown(false);
      return;
    }
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const { cards: newCards, loadMoreShown } = await loadFilteredAICards({
        lastInteraction,
        lastId,
        filters: {
          owner: aiCardModalType === 'want' ? partnerName : myUsername
        }
      });
      for (const card of newCards) {
        onUpdateAICard({ cardId: card.id, newState: card });
      }
      const shownCardIds = new Set(cards.map((card) => card.id));
      const newCardIds: number[] = [];
      for (const card of newCards) {
        if (!shownCardIds.has(card.id)) {
          shownCardIds.add(card.id);
          newCardIds.push(card.id);
        }
      }
      onSetCardIds((prevCardIds: number[]) => {
        const existingCardIds = new Set(prevCardIds);
        const cardIdsToAppend = newCardIds.filter(
          (cardId) => !existingCardIds.has(cardId)
        );
        return cardIdsToAppend.length
          ? [...prevCardIds, ...cardIdsToAppend]
          : prevCardIds;
      });
      onSetLoadMoreShown(loadMoreShown && newCardIds.length > 0);
    } catch (error) {
      console.error(error);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }
}
