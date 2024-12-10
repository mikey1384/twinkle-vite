import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import CheckListGroup from '~/components/CheckListGroup';
import FilterBar from '~/components/FilterBar';
import Banner from '~/components/Banner';
import SearchInput from '~/components/Texts/SearchInput';
import Loading from '~/components/Loading';
import { useSearch } from '~/helpers/hooks';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { isEqual } from 'lodash';
import { useAppContext, useExploreContext, useKeyContext } from '~/contexts';

export default function SelectFeaturedPlaylists({
  onHide,
  selectedPlaylists: initialSelectedPlaylists
}: {
  onHide: () => void;
  selectedPlaylists: any[];
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const loadPlaylistList = useAppContext(
    (v) => v.requestHelpers.loadPlaylistList
  );
  const searchContent = useAppContext((v) => v.requestHelpers.searchContent);
  const uploadFeaturedPlaylists = useAppContext(
    (v) => v.requestHelpers.uploadFeaturedPlaylists
  );
  const featuredPlaylists = useExploreContext(
    (v) => v.state.videos.featuredPlaylists
  );
  const loadMoreButton = useExploreContext(
    (v) => v.state.videos.loadMoreFeaturedPlaylistsButton
  );
  const playlistsToPin = useExploreContext(
    (v) => v.state.videos.playlistsToPin
  );
  const onChangeFeaturedPlaylists = useExploreContext(
    (v) => v.actions.onChangeFeaturedPlaylists
  );
  const onLoadMorePlaylistsToPin = useExploreContext(
    (v) => v.actions.onLoadMorePlaylistsToPin
  );

  const [selectTabActive, setSelectTabActive] = useState(true);
  const [selectedPlaylists, setSelectedPlaylists] = useState<any[]>([]);
  const [searchedPlaylists, setSearchedPlaylists] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchLoadMoreButton, setSearchLoadMoreButton] = useState(false);
  const [searchText, setSearchText] = useState('');
  const playlistsToPinObjectRef = useRef({});
  const pinnedPlaylistsObjectRef = useRef({});
  const searchedPlaylistsObjectRef = useRef({});
  const playlistObjectsRef: React.MutableRefObject<any> = useRef({});
  const { handleSearch, searching } = useSearch({
    onSearch: handlePlaylistSearch,
    onClear: () => setSearchedPlaylists([]),
    onSetSearchText: setSearchText
  });

  useEffect(() => {
    pinnedPlaylistsObjectRef.current = featuredPlaylists.reduce(
      (prev: any, playlist: any) => ({
        ...prev,
        [playlist.id]: playlist.title
      }),
      {}
    );
    setSelectedPlaylists(initialSelectedPlaylists);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    playlistsToPinObjectRef.current = playlistsToPin.reduce(
      (prev: any, playlist: any) => ({
        ...prev,
        [playlist.id]: playlist.title
      }),
      {}
    );
  }, [playlistsToPin]);

  playlistObjectsRef.current = {
    ...playlistObjectsRef.current,
    ...pinnedPlaylistsObjectRef.current,
    ...playlistsToPinObjectRef.current,
    ...searchedPlaylistsObjectRef.current
  };

  const lastPlaylistId = playlistsToPin[playlistsToPin.length - 1].id;
  const displayedLoadMoreButton = stringIsEmpty(searchText)
    ? loadMoreButton
    : searchLoadMoreButton;

  return (
    <Modal onHide={onHide}>
      <header>Select up to 5 playlists</header>
      <main style={{ paddingTop: 0 }}>
        {selectedPlaylists.length > 5 && (
          <Banner>Please limit your selection to 5 playlists</Banner>
        )}
        <FilterBar>
          <nav
            className={selectTabActive ? 'active' : ''}
            onClick={() => setSelectTabActive(true)}
            style={{ cursor: 'pointer' }}
          >
            Select
          </nav>
          <nav
            className={selectTabActive ? '' : 'active'}
            onClick={() => setSelectTabActive(false)}
            style={{ cursor: 'pointer' }}
          >
            Selected
          </nav>
        </FilterBar>
        <div style={{ marginTop: '1rem', width: '100%' }}>
          {selectTabActive && (
            <>
              <SearchInput
                autoFocus
                placeholder="Search for playlists to feature..."
                value={searchText}
                onChange={handleSearch}
              />
              {searching ? (
                <Loading />
              ) : (
                <CheckListGroup
                  style={{ marginTop: '1rem' }}
                  inputType="checkbox"
                  onSelect={handleSelect}
                  listItems={renderListItems()}
                />
              )}
              {displayedLoadMoreButton && !searching && (
                <LoadMoreButton
                  style={{ marginTop: '2rem', width: '100%' }}
                  transparent
                  onClick={() => handleLoadMore(lastPlaylistId)}
                  loading={loadingMore}
                />
              )}
              {playlistsToPin.length === 0 && (
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '10rem',
                    fontWeight: 'bold',
                    fontSize: '2.5rem',
                    justifyContent: 'center'
                  }}
                >
                  No Playlists
                </p>
              )}
            </>
          )}
          {!selectTabActive && (
            <>
              <CheckListGroup
                inputType="checkbox"
                onSelect={handleDeselect}
                listItems={selectedPlaylists.map((playlistId) => ({
                  label: playlistObjectsRef.current[playlistId],
                  checked: true
                }))}
              />
              {selectedPlaylists.length === 0 && (
                <p
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '10rem',
                    fontWeight: 'bold',
                    fontSize: '2.5rem',
                    justifyContent: 'center'
                  }}
                >
                  No Playlists Selected
                </p>
              )}
            </>
          )}
        </div>
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          color={doneColor}
          onClick={handleSubmit}
          disabled={
            isEqual(selectedPlaylists, initialSelectedPlaylists) ||
            selectedPlaylists.length > 5
          }
          loading={uploading}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );

  async function handleLoadMore(playlistId: number) {
    setLoadingMore(true);
    if (stringIsEmpty(searchText)) {
      const data = await loadPlaylistList(playlistId);
      onLoadMorePlaylistsToPin(data);
      return setLoadingMore(false);
    }
    const { loadMoreButton: loadMoreShown, results } = await searchContent({
      limit: 10,
      filter: 'playlist',
      searchText,
      shownResults: searchedPlaylists
    });
    searchedPlaylistsObjectRef.current = {
      ...searchedPlaylistsObjectRef.current,
      ...results.reduce(
        (prev: any, playlist: any) => ({
          ...prev,
          [playlist.id]: playlist.title
        }),
        {}
      )
    };
    setSearchedPlaylists((searchedPlaylists) =>
      searchedPlaylists.concat(results)
    );
    setLoadingMore(false);
    setSearchLoadMoreButton(loadMoreShown);
  }

  async function handlePlaylistSearch(text: string) {
    const { loadMoreButton: loadMoreShown, results } = await searchContent({
      limit: 10,
      filter: 'playlist',
      searchText: text
    });
    searchedPlaylistsObjectRef.current = results.reduce(
      (prev: any, playlist: any) => ({
        ...prev,
        [playlist.id]: playlist.title
      }),
      {}
    );
    setSearchedPlaylists(results);
    setSearchLoadMoreButton(loadMoreShown);
  }

  function handleSelect(index: number) {
    const playlists = searchText ? searchedPlaylists : playlistsToPin;
    const playlistId = playlists[index].id;
    setSelectedPlaylists(
      !selectedPlaylists.includes(playlistId)
        ? [playlistId].concat(selectedPlaylists)
        : selectedPlaylists.filter((id) => id !== playlistId)
    );
  }

  function handleDeselect(selectedIndex: number) {
    const newSelectedPlaylists = selectedPlaylists.filter(
      (playlist, index) => index !== selectedIndex
    );
    setSelectedPlaylists(newSelectedPlaylists);
  }

  async function handleSubmit() {
    setUploading(true);
    const newFeaturedPlaylists = await uploadFeaturedPlaylists({
      selectedPlaylists
    });
    onChangeFeaturedPlaylists(newFeaturedPlaylists);
    onHide();
  }

  function renderListItems() {
    const playlists = searchText ? searchedPlaylists : playlistsToPin;
    return playlists.map((playlist: any) => ({
      label: playlist.title,
      checked: selectedPlaylists.includes(playlist.id)
    }));
  }
}
