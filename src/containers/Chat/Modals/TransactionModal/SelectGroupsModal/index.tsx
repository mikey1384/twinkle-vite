import React, { useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SearchBar from './SearchBar';
import FilterBar from '~/components/FilterBar';
import Main from './Main';
import Searched from './Searched';
import Selected from './Selected';
import { useAppContext, useKeyContext } from '~/contexts';

export default function SelectGroupsModal({
  onHide,
  onSelectDone,
  type,
  partner,
  currentlySelectedGroupIds
}: {
  onHide: () => void;
  onSelectDone: (groupIds: number[]) => void;
  type: 'offer' | 'want';
  partner: {
    username: string;
    id: number;
  };
  currentlySelectedGroupIds: number[];
}) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSelectedTab, setIsSelectedTab] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>(
    currentlySelectedGroupIds
  );
  const [searchQuery, setSearchQuery] = useState('');
  const loadGroupsForTrade = useAppContext(
    (v) => v.requestHelpers.loadGroupsForTrade
  );
  const {
    done: { color: doneColor },
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const { results, loadMoreShown } = await loadGroupsForTrade({
          partnerId: partner.id,
          type
        });
        setGroups(results);
        setLoadMoreShown(loadMoreShown);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSearched = useMemo(() => searchQuery.trim() !== '', [searchQuery]);

  const headerLabel = useMemo(
    () => `${type === 'want' ? `${partner.username}'s` : 'My'} groups`,
    [type, partner.username]
  );

  return (
    <Modal large wrapped modalOverModal onHide={onHide}>
      <header>{headerLabel}</header>
      <main>
        <SearchBar
          placeholder="Search groups..."
          search={searchQuery}
          onChange={setSearchQuery}
        />
        <FilterBar style={{ marginBottom: '2rem' }}>
          <nav
            className={isSelectedTab ? '' : 'active'}
            onClick={() => setIsSelectedTab(false)}
          >
            All
          </nav>
          <nav
            className={isSelectedTab ? 'active' : ''}
            onClick={() => setIsSelectedTab(true)}
          >
            Selected
            {selectedGroupIds.length > 0 ? ` (${selectedGroupIds.length})` : ''}
          </nav>
        </FilterBar>
        {isSelectedTab ? (
          <Selected
            groups={groups}
            selectedGroupIds={selectedGroupIds}
            onSetSelectedGroupIds={setSelectedGroupIds}
          />
        ) : isSearched ? (
          <Searched
            searchQuery={searchQuery}
            loadGroupsForTrade={loadGroupsForTrade}
            loadMoreShown={loadMoreShown}
            onSetLoadMoreShown={setLoadMoreShown}
            selectedGroupIds={selectedGroupIds}
            onSetSelectedGroupIds={setSelectedGroupIds}
            type={type}
            partnerId={partner.id}
          />
        ) : (
          <Main
            groups={groups}
            loading={loading}
            loadMoreShown={loadMoreShown}
            loadGroupsForTrade={loadGroupsForTrade}
            onSetGroups={setGroups}
            onSetLoadMoreShown={setLoadMoreShown}
            selectedGroupIds={selectedGroupIds}
            onSetSelectedGroupIds={setSelectedGroupIds}
            successColor={successColor}
            type={type}
            partnerId={partner.id}
          />
        )}
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          disabled={selectedGroupIds.length === 0}
          color={doneColor}
          onClick={() => onSelectDone(selectedGroupIds)}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );
}
