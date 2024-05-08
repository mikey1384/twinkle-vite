import React, { useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import FilterPanel from './FilterPanel';
import FilterBar from '~/components/FilterBar';
import Main from './Main';
import Filtered from './Filtered';
import Selected from './Selected';
import { calculateTotalBurnValue } from '~/helpers';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

export default function SelectAICardModal({
  currentlySelectedCardIds,
  filters: initFilters,
  headerLabel = '',
  onHide,
  onSetAICardModalCardId,
  onSelectDone,
  onDropdownShown
}: {
  filters: Record<string, any>;
  currentlySelectedCardIds: any[];
  headerLabel?: string;
  onHide: () => any;
  onSetAICardModalCardId: (v: any) => any;
  onSelectDone: (v: any) => any;
  onDropdownShown: (v?: any) => any;
}) {
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const [isSelectedTab, setIsSelectedTab] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [cardIds, setCardIds] = useState(currentlySelectedCardIds);
  const [loading, setLoading] = useState(false);
  const [filterPanelShown, setFilterPanelShown] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState(
    currentlySelectedCardIds
  );
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
          filters: initFilters
        });
        setCardIds(cards.map((card: { id: number }) => card.id));
        for (const card of cards) {
          onUpdateAICard({ cardId: card.id, newState: card });
        }
        setFilterPanelShown(loadMoreShown);
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

  const isFiltered = useMemo(() => {
    return (
      (filters?.color && filters?.color !== 'any') ||
      (filters?.quality && filters?.quality !== 'any') ||
      filters?.word ||
      filters?.style ||
      filters?.cardId ||
      filters?.isDalle3
    );
  }, [
    filters?.color,
    filters?.quality,
    filters?.word,
    filters?.style,
    filters?.cardId,
    filters?.isDalle3
  ]);

  const cards = cardIds
    .map((cardId) => cardObj[cardId])
    .filter((card) => !!card && !card.isBurned);

  const totalBvOfSelectedCards = useMemo(() => {
    const totalBv = calculateTotalBurnValue(
      selectedCardIds.map((cardId) => cardObj[cardId])
    );
    return totalBv ? `${addCommasToNumber(totalBv)} XP` : '';
  }, [cardObj, selectedCardIds]);

  return (
    <Modal large wrapped modalOverModal onHide={onHide}>
      <header>{headerLabel}</header>
      <main>
        {filterPanelShown && (
          <FilterPanel
            filters={filters}
            onSetFilters={setFilters}
            onDropdownShown={onDropdownShown}
          />
        )}
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
            onSetAICardModalCardId={onSetAICardModalCardId}
            onSetSelectedCardIds={setSelectedCardIds}
            color={filters.color}
            quality={filters.quality}
            successColor={successColor}
          />
        ) : isFiltered ? (
          <Filtered
            initFilters={initFilters}
            cardId={filters.cardId}
            cardObj={cardObj}
            color={filters.color}
            isDalle3={filters.isDalle3}
            loadFilteredAICards={loadFilteredAICards}
            onUpdateAICard={onUpdateAICard}
            onSetSelectedCardIds={setSelectedCardIds}
            onSetAICardModalCardId={onSetAICardModalCardId}
            quality={filters.quality}
            cardStyle={filters.style}
            word={filters.word}
            selectedCardIds={selectedCardIds}
            successColor={successColor}
          />
        ) : (
          <Main
            initFilters={initFilters}
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
            onSetAICardModalCardId={onSetAICardModalCardId}
          />
        )}
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
