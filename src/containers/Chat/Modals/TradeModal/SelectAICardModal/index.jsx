import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import CardItem from './CardItem';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { objectify } from '~/helpers';
import { useAppContext, useKeyContext } from '~/contexts';

SelectAICardModal.propTypes = {
  aiCardModalType: PropTypes.string.isRequired,
  currentlySelectedCards: PropTypes.array.isRequired,
  onHide: PropTypes.func,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  onSelectDone: PropTypes.func.isRequired,
  partnerName: PropTypes.string.isRequired
};

export default function SelectAICardModal({
  aiCardModalType,
  currentlySelectedCards,
  onHide,
  onSetAICardModalCardId,
  onSelectDone,
  partnerName
}) {
  const [cardObj, setCardObj] = useState(objectify(currentlySelectedCards));
  const [cards, setCards] = useState(currentlySelectedCards);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState(
    currentlySelectedCards.map((card) => card.id)
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
        setCards(cards);
        setCardObj((prevCardObj) => ({
          ...prevCardObj,
          ...objectify(cards)
        }));
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
    setCards((prevCards) => [...prevCards, ...newCards]);
    setCardObj((prevCardObj) => ({
      ...prevCardObj,
      ...objectify(newCards)
    }));
    setLoadMoreShown(loadMoreShown);
    setLoadingMore(false);
  }
}
