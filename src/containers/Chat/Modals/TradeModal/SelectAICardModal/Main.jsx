import { useState } from 'react';
import PropTypes from 'prop-types';
import CardItem from './CardItem';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

Main.propTypes = {
  aiCardModalType: PropTypes.string,
  cards: PropTypes.array,
  loading: PropTypes.bool,
  loadFilteredAICards: PropTypes.func.isRequired,
  myUsername: PropTypes.string,
  partnerName: PropTypes.string,
  selectedCardIds: PropTypes.array,
  successColor: PropTypes.string,
  loadMoreShown: PropTypes.bool,
  onSetCardIds: PropTypes.func.isRequired,
  onSetLoadMoreShown: PropTypes.func.isRequired,
  onSetSelectedCardIds: PropTypes.func.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  onUpdateAICard: PropTypes.func.isRequired
};

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
    setLoadingMore(true);
    const { cards: newCards, loadMoreShown } = await loadFilteredAICards({
      lastInteraction,
      filters: {
        owner: aiCardModalType === 'want' ? partnerName : myUsername
      }
    });
    for (let card of newCards) {
      onUpdateAICard({ cardId: card.id, newState: card });
    }
    onSetCardIds((prevCardIds) => [
      ...prevCardIds,
      ...newCards.map((card) => card.id)
    ]);
    onSetLoadMoreShown(loadMoreShown);
    setLoadingMore(false);
  }
}
