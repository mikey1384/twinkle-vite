import React, { useEffect, useMemo, useState, useRef } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SearchBar from './SearchBar';
import FilterBar from '~/components/FilterBar';
import Main from './Main';
import Searched from './Searched';
import Selected from './Selected';
import { useAppContext, useKeyContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';
import { objectify } from '~/helpers';

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
  const [searchedGroups, setSearchedGroups] = useState<number[]>([]);
  const [searchLoadMoreShown, setSearchLoadMoreShown] = useState(false);
  const [searchText, setSearchText] = useState('');
  const groupObjs = useRef<Record<number, any>>({});

  const loadGroupsForTrade = useAppContext(
    (v) => v.requestHelpers.loadGroupsForTrade
  );
  const searchGroupsForTrade = useAppContext(
    (v) => v.requestHelpers.searchGroupsForTrade
  );
  const {
    done: { color: doneColor },
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);

  const { handleSearch, searching } = useSearch({
    onSearch,
    onClear: () => setSearchedGroups([]),
    onSetSearchText: setSearchText
  });

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

  const isSearched = useMemo(() => searchText.trim() !== '', [searchText]);

  const headerLabel = useMemo(
    () => `${type === 'want' ? `${partner.username}'s` : 'My'} groups`,
    [type, partner.username]
  );

  async function onSearch(text: string) {
    try {
      const { results, loadMoreShown } = await searchGroupsForTrade({
        partnerId: partner.id,
        type,
        searchQuery: text
      });
      groupObjs.current = {
        ...groupObjs.current,
        ...objectify(results)
      };
      setSearchedGroups(results.map((group: { id: number }) => group.id));
      setSearchLoadMoreShown(loadMoreShown);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Modal large wrapped modalOverModal onHide={onHide}>
      <header>{headerLabel}</header>
      <main>
        <SearchBar
          placeholder="Search groups..."
          search={searchText}
          onChange={handleSearch}
        />
        <FilterBar style={{ marginBottom: '2rem' }}>
          <nav
            className={isSelectedTab ? '' : 'active'}
            onClick={() => setIsSelectedTab(false)}
          >
            {isSearched ? 'Searched' : 'All'}
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
            searchQuery={searchText}
            searchGroupsForTrade={searchGroupsForTrade}
            loadMoreShown={searchLoadMoreShown}
            onSetLoadMoreShown={setSearchLoadMoreShown}
            selectedGroupIds={selectedGroupIds}
            onSetSelectedGroupIds={setSelectedGroupIds}
            type={type}
            partnerId={partner.id}
            groupObjs={groupObjs.current}
            searchedGroups={searchedGroups}
            setSearchedGroups={setSearchedGroups}
            searching={searching}
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
