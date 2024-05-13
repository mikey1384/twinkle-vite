import React, { useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import FilterPanel from './FilterPanel';
import FilterBar from '~/components/FilterBar';
import Main from './Main';
import Selected from './Selected';
import AICardModal from '~/components/Modals/AICardModal';
import ConfirmSelectionModal from './ConfirmSelectionModal';
import { calculateTotalBurnValue } from '~/helpers';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

const MAX_SELECTED_CARDS = 30;

export default function SelectAICardModal({
  filters: initFilters,
  isBuy,
  headerLabel = `Select Cards${isBuy ? ' to Buy' : ' to Sell'}`,
  onHide,
  onDropdownShown = () => {}
}: {
  filters: Record<string, any>;
  isBuy: boolean;
  headerLabel?: string;
  onHide: () => any;
  onDropdownShown?: (isShown: boolean) => any;
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [aiCardModalCardId, setAICardModalCardId] = useState<any>(null);
  const [isSelectedTab, setIsSelectedTab] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>(initFilters);
  const [cardIds, setCardIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
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
          filters,
          excludeMyCards: isBuy
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
  }, [
    filters?.color,
    filters?.quality,
    filters?.word,
    filters?.style,
    filters?.cardId,
    filters?.isDalle3
  ]);

  const cards = useMemo(() => {
    const cardsWithGlobalState = cardIds.map((cardId) => cardObj[cardId]);
    if (isBuy) {
      return cardsWithGlobalState.filter(
        (card) => !!card && !card.isBurned && card.owner?.id !== userId
      );
    }
    return cardsWithGlobalState.filter((card) => !!card && !card.isBurned);
  }, [cardIds, cardObj, isBuy, userId]);

  const totalBvOfSelectedCards = useMemo(() => {
    const totalBv = calculateTotalBurnValue(
      selectedCardIds.map((cardId) => cardObj[cardId])
    );
    return totalBv ? `${addCommasToNumber(totalBv)} XP` : '';
  }, [cardObj, selectedCardIds]);

  return (
    <Modal large wrapped onHide={onHide}>
      <header>{headerLabel}</header>
      <main>
        <FilterPanel
          filters={filters}
          onSetFilters={setFilters}
          onDropdownShown={onDropdownShown}
        />
        <FilterBar style={{ marginBottom: '2rem' }}>
          <nav
            className={isSelectedTab ? '' : 'active'}
            onClick={() => {
              setIsSelectedTab(false);
            }}
          >
            All
          </nav>
          <nav
            className={isSelectedTab ? 'active' : ''}
            onClick={() => {
              setIsSelectedTab(true);
            }}
          >
            Selected
            {totalBvOfSelectedCards ? ` (${totalBvOfSelectedCards})` : ''}
          </nav>
        </FilterBar>
        {isSelectedTab ? (
          <Selected
            cardObj={cardObj}
            cardIds={selectedCardIds}
            onSetAICardModalCardId={setAICardModalCardId}
            onSetSelectedCardIds={setSelectedCardIds}
            color={filters.color}
            quality={filters.quality}
            successColor={successColor}
          />
        ) : (
          <Main
            isBuy={isBuy}
            filters={filters}
            cards={cards}
            loading={loading}
            loadFilteredAICards={loadFilteredAICards}
            loadMoreShown={loadMoreShown}
            onSetCardIds={setCardIds}
            onSetLoadMoreShown={setLoadMoreShown}
            onSetSelectedCardIds={setSelectedCardIds}
            onUpdateAICard={onUpdateAICard}
            selectedCardIds={selectedCardIds}
            successColor={successColor}
            onSetAICardModalCardId={setAICardModalCardId}
          />
        )}
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          disabled={
            !selectedCardIds?.length ||
            selectedCardIds?.length > MAX_SELECTED_CARDS
          }
          color={doneColor}
          onClick={() => setConfirmModalShown(true)}
        >
          {selectedCardIds.length > MAX_SELECTED_CARDS
            ? `${selectedCardIds.length} cards selected. Maximum is ${MAX_SELECTED_CARDS}`
            : 'Done'}
        </Button>
      </footer>
      {confirmModalShown && (
        <ConfirmSelectionModal
          selectedCardIds={selectedCardIds}
          isAICardModalShown={!!aiCardModalCardId}
          onSetAICardModalCardId={setAICardModalCardId}
          onHide={() => {
            setConfirmModalShown(false);
          }}
        />
      )}
      {aiCardModalCardId && (
        <AICardModal
          modalOverModal
          cardId={aiCardModalCardId}
          onHide={() => {
            setAICardModalCardId(null);
          }}
        />
      )}
    </Modal>
  );
}
