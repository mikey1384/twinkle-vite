import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import CardItem from './CardItem';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

SelectAICardModal.propTypes = {
  aiCardModalType: PropTypes.string.isRequired,
  currentlySelectedCardIds: PropTypes.array.isRequired,
  onHide: PropTypes.func,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  onSelectDone: PropTypes.func.isRequired,
  partnerName: PropTypes.string.isRequired
};

export default function SelectAICardModal({
  aiCardModalType,
  currentlySelectedCardIds,
  onHide,
  onSetAICardModalCardId,
  onSelectDone,
  partnerName
}) {
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const [cardIds, setCardIds] = useState(currentlySelectedCardIds);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState(
    currentlySelectedCardIds.map((card) => card.id)
  );
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const { username } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor },
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);
  const loadFilteredAICards = useAppContext(
    (v) => v.requestHelpers.loadFilteredAICards
  );

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const { cards, loadMoreShown } = await loadFilteredAICards({
          filters: {
            owner: aiCardModalType === 'want' ? partnerName : username
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
  }, []);

  const headerLabel = useMemo(() => {
    if (aiCardModalType === 'want') {
      return `${partnerName}'s AI Cards`;
    }
    if (aiCardModalType === 'offer') {
      return `My AI Cards`;
    }
  }, [aiCardModalType, partnerName]);

  const cards = cardIds
    .map((cardId) => cardObj[cardId])
    .filter((card) => !!card);

  return (
    <Modal large modalOverModal onHide={onHide}>
      <header>{headerLabel}</header>
      <main>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
          {loading ? (
            <Loading />
          ) : (
            cards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                selected={selectedCardIds.includes(card.id)}
                onSelect={() =>
                  setSelectedCardIds((prevIds) => [...prevIds, card.id])
                }
                onDeselect={() =>
                  setSelectedCardIds((prevIds) =>
                    prevIds.filter((id) => id !== card.id)
                  )
                }
                successColor={successColor}
                onSetAICardModalCardId={onSetAICardModalCardId}
              />
            ))
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
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          disabled={!selectedCardIds?.length}
          color={doneColor}
          onClick={() => {
            onSelectDone(selectedCardIds.map((cardId) => cardObj[cardId]));
          }}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );

  async function handleLoadMore() {
    const lastInteraction = cards[cards.length - 1]?.lastInteraction;
    setLoadingMore(true);
    const { cards: newCards, loadMoreShown } = await loadFilteredAICards({
      lastInteraction,
      filters: {
        owner: aiCardModalType === 'want' ? partnerName : username
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
