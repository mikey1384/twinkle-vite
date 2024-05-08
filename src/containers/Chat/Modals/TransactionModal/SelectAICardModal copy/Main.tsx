import React, { useState } from 'react';
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
    const lastInteraction = cards[cards.length - 1]?.lastInteraction;
    const lastId = cards[cards.length - 1]?.id;
    setLoadingMore(true);
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
    onSetCardIds((prevCardIds: number[]) => [
      ...prevCardIds,
      ...newCards.map((card: { id: number }) => card.id)
    ]);
    onSetLoadMoreShown(loadMoreShown);
    setLoadingMore(false);
  }
}
