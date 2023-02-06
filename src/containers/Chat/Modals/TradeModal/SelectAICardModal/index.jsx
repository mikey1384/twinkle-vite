import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SearchPanel from './SearchPanel';
import Main from './Main';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

SelectAICardModal.propTypes = {
  aiCardModalType: PropTypes.string.isRequired,
  currentlySelectedCardIds: PropTypes.array.isRequired,
  onHide: PropTypes.func,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  onSelectDone: PropTypes.func.isRequired,
  onDropdownShown: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired
};

export default function SelectAICardModal({
  aiCardModalType,
  currentlySelectedCardIds,
  onHide,
  onSetAICardModalCardId,
  onSelectDone,
  onDropdownShown,
  partner
}) {
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const [filters, setFilters] = useState({});
  const [cardIds, setCardIds] = useState(currentlySelectedCardIds);
  const [loading, setLoading] = useState(false);
  const [searchPanelShown, setSearchPanelShown] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState(
    currentlySelectedCardIds
  );
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const { userId, username } = useKeyContext((v) => v.myState);
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
            owner: aiCardModalType === 'want' ? partner.username : username
          }
        });
        setCardIds(cards.map((card) => card.id));
        for (let card of cards) {
          onUpdateAICard({ cardId: card.id, newState: card });
        }
        setSearchPanelShown(loadMoreShown);
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

  useEffect(() => {
    console.log(filters?.color, filters?.quality);
  }, [filters?.color, filters?.quality]);

  const headerLabel = useMemo(() => {
    if (aiCardModalType === 'want') {
      return `${partner.username}'s AI Cards`;
    }
    if (aiCardModalType === 'offer') {
      return `My AI Cards`;
    }
  }, [aiCardModalType, partner.username]);

  const cards = cardIds
    .map((cardId) => cardObj[cardId])
    .filter(
      (card) =>
        !!card &&
        !card.isBurned &&
        (aiCardModalType === 'want'
          ? card.ownerId === partner.id
          : card.ownerId === userId)
    );

  return (
    <Modal large modalOverModal onHide={onHide}>
      <header>{headerLabel}</header>
      <main>
        {searchPanelShown && (
          <SearchPanel
            filters={filters}
            onSetFilters={setFilters}
            onDropdownShown={onDropdownShown}
          />
        )}
        <Main
          aiCardModalType={aiCardModalType}
          cards={cards}
          loading={loading}
          loadFilteredAICards={loadFilteredAICards}
          loadMoreShown={loadMoreShown}
          myUsername={username}
          onSetCardIds={setCardIds}
          onSetLoadMoreShown={setLoadMoreShown}
          onSetSelectedCardIds={setSelectedCardIds}
          onUpdateAICard={onUpdateAICard}
          partnerName={partner.username}
          selectedCardIds={selectedCardIds}
          successColor={successColor}
          onSetAICardModalCardId={onSetAICardModalCardId}
        />
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          disabled={!selectedCardIds?.length}
          color={doneColor}
          onClick={() => {
            onSelectDone(selectedCardIds);
          }}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );
}
