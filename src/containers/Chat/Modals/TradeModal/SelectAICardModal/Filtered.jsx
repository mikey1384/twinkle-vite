import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import CardItem from './CardItem';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

Filtered.propTypes = {
  aiCardModalType: PropTypes.string,
  cardObj: PropTypes.object,
  color: PropTypes.string,
  quality: PropTypes.string,
  loadFilteredAICards: PropTypes.func.isRequired,
  myId: PropTypes.number,
  myUsername: PropTypes.string,
  onUpdateAICard: PropTypes.func.isRequired,
  onSetSelectedCardIds: PropTypes.func.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partnerId: PropTypes.number,
  partnerName: PropTypes.string,
  selectedCardIds: PropTypes.array,
  successColor: PropTypes.string
};

export default function Filtered({
  aiCardModalType,
  cardObj,
  color,
  quality,
  loadFilteredAICards,
  myId,
  myUsername,
  onUpdateAICard,
  onSetSelectedCardIds,
  onSetAICardModalCardId,
  partnerId,
  partnerName,
  selectedCardIds,
  successColor
}) {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const [cardIds, setCardIds] = useState([]);
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
            ...(!quality || quality === 'any' ? {} : { quality })
          }
        });
        setCardIds(cards.map((card) => card.id));
        for (let card of cards) {
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
  }, [color, quality]);

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
              onSetSelectedCardIds((prevIds) => [...prevIds, card.id])
            }
            onDeselect={() =>
              onSetSelectedCardIds((prevIds) =>
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
            There are no cards that match the filter criteria
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
    setLoadingMore(true);
    const { cards: newCards, loadMoreShown } = await loadFilteredAICards({
      lastInteraction,
      filters: {
        owner: aiCardModalType === 'want' ? partnerName : myUsername,
        ...(!color || color === 'any' ? {} : { color }),
        ...(!quality || quality === 'any' ? {} : { quality })
      }
    });
    for (let card of newCards) {
      onUpdateAICard({ cardId: card.id, newState: card });
    }
    setCardIds((prevCardIds) => [
      ...prevCardIds,
      ...newCards.map((card) => card.id)
    ]);
    setLoadMoreShown(loadMoreShown);
    setLoadingMore(false);
  }
}
