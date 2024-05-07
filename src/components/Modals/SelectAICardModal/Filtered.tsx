import React, { useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import CardItem from './CardItem';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function Filtered({
  aiCardModalType,
  cardId,
  cardObj,
  color,
  quality,
  isDalle3,
  cardStyle,
  loadFilteredAICards,
  myId,
  myUsername,
  onUpdateAICard,
  onSetSelectedCardIds,
  onSetAICardModalCardId,
  partnerId,
  partnerName,
  selectedCardIds,
  successColor,
  word
}: {
  aiCardModalType: string;
  cardObj: any;
  cardId: number;
  color: string;
  quality: string;
  cardStyle: string;
  isDalle3: boolean;
  loadFilteredAICards: (v: any) => any;
  myId: number;
  myUsername: string;
  onUpdateAICard: (v: any) => any;
  onSetSelectedCardIds: (v: any) => any;
  onSetAICardModalCardId: (v: any) => any;
  partnerId: number;
  partnerName: string;
  selectedCardIds: any[];
  successColor: string;
  word: string;
}) {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const [cardIds, setCardIds] = useState<any[]>([]);
  const cards = cardIds
    .map((cardId) => cardObj[cardId])
    .filter(
      (card) =>
        !!card &&
        !card.isBurned &&
        (aiCardModalType === 'want'
          ? card.ownerId === partnerId
          : card.ownerId === myId)
    );

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const { cards, loadMoreShown } = await loadFilteredAICards({
          filters: {
            owner: aiCardModalType === 'want' ? partnerName : myUsername,
            ...(!color || color === 'any' ? {} : { color }),
            ...(!quality || quality === 'any' ? {} : { quality }),
            ...(!word ? {} : { word }),
            ...(!cardStyle ? {} : { style: cardStyle }),
            ...(!cardId ? {} : { cardId }),
            ...(isDalle3 ? { isDalle3 } : {})
          }
        });
        setCardIds(cards.map((card: { id: number }) => card.id));
        for (const card of cards) {
          onUpdateAICard({ cardId: card.id, newState: card });
        }
        setLoadMoreShown(loadMoreShown);
        setLoading(false);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardStyle, color, quality, word, cardId, isDalle3]);

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
              onSetSelectedCardIds((prevIds: number[]) => [...prevIds, card.id])
            }
            onDeselect={() =>
              onSetSelectedCardIds((prevIds: number[]) =>
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
              : `You don't own`}{' '}
            any cards that match the filter criteria
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
        owner: aiCardModalType === 'want' ? partnerName : myUsername,
        ...(!color || color === 'any' ? {} : { color }),
        ...(!quality || quality === 'any' ? {} : { quality }),
        ...(!cardStyle ? {} : { style: cardStyle }),
        ...(isDalle3 ? { isDalle3 } : {})
      }
    });
    for (const card of newCards) {
      onUpdateAICard({ cardId: card.id, newState: card });
    }
    setCardIds((prevCardIds: any) => [
      ...prevCardIds,
      ...newCards.map((card: { id: number }) => card.id)
    ]);
    setLoadMoreShown(loadMoreShown);
    setLoadingMore(false);
  }
}
