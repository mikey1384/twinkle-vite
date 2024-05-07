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
  aiCardModalType,
  currentlySelectedCardIds,
  filters: initFilters,
  headerLabel = '',
  onHide,
  onSetAICardModalCardId,
  onSelectDone,
  onDropdownShown,
  partner
}: {
  aiCardModalType: string;
  filters: Record<string, any>;
  currentlySelectedCardIds: any[];
  headerLabel?: string;
  onHide: () => any;
  onSetAICardModalCardId: (v: any) => any;
  onSelectDone: (v: any) => any;
  onDropdownShown: (v?: any) => any;
  partner: {
    username: string;
    id: number;
  };
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
    .filter(
      (card) =>
        !!card &&
        !card.isBurned &&
        (aiCardModalType === 'want'
          ? card.ownerId === partner.id
          : card.ownerId === userId)
    );

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
            aiCardModalType={aiCardModalType}
            cardObj={cardObj}
            cardIds={selectedCardIds}
            onSetAICardModalCardId={onSetAICardModalCardId}
            onSetSelectedCardIds={setSelectedCardIds}
            partnerId={partner.id}
            color={filters.color}
            quality={filters.quality}
            myId={userId}
            successColor={successColor}
          />
        ) : isFiltered ? (
          <Filtered
            aiCardModalType={aiCardModalType}
            cardId={filters.cardId}
            cardObj={cardObj}
            color={filters.color}
            isDalle3={filters.isDalle3}
            loadFilteredAICards={loadFilteredAICards}
            myId={userId}
            myUsername={username}
            onUpdateAICard={onUpdateAICard}
            onSetSelectedCardIds={setSelectedCardIds}
            onSetAICardModalCardId={onSetAICardModalCardId}
            partnerId={partner.id}
            partnerName={partner.username}
            quality={filters.quality}
            cardStyle={filters.style}
            word={filters.word}
            selectedCardIds={selectedCardIds}
            successColor={successColor}
          />
        ) : (
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
