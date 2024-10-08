import React from 'react';
import PlaylistCarousel from '../PlaylistCarousel';
import SectionPanel from '~/components/SectionPanel';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext, useExploreContext } from '~/contexts';
import localize from '~/constants/localize';

const noPlaylistsLabel = localize('noPlaylists');
const searchPlaylistsLabel = localize('searchPlaylists');
const allPlaylistsLabel = localize('allPlaylists');

export default function PlaylistsPanel({
  buttonGroupShown = true,
  buttonGroup,
  isSearching,
  innerRef,
  loaded,
  loadMoreButton,
  onSearch,
  playlists,
  searchQuery,
  style,
  title = allPlaylistsLabel,
  userId
}: {
  buttonGroupShown?: boolean;
  buttonGroup: () => React.ReactNode;
  innerRef?: React.RefObject<any>;
  isSearching?: boolean;
  loaded: boolean;
  loadMoreButton?: boolean;
  onSearch?: (query: string) => void;
  playlists: any[];
  searchQuery?: string;
  style?: React.CSSProperties;
  title?: string;
  userId?: number;
}) {
  const loadPlaylists = useAppContext((v) => v.requestHelpers.loadPlaylists);
  const searchContent = useAppContext((v) => v.requestHelpers.searchContent);
  const onLoadMorePlaylists = useExploreContext(
    (v) => v.actions.onLoadMorePlaylists
  );

  return (
    <SectionPanel
      innerRef={innerRef}
      style={style}
      title={title}
      button={buttonGroupShown ? buttonGroup() : null}
      searchPlaceholder={`${searchPlaylistsLabel}...`}
      emptyMessage={noPlaylistsLabel}
      isEmpty={!playlists?.length}
      loaded={loaded}
      loadMoreButtonShown={!isSearching && loadMoreButton}
      onLoadMore={handleLoadMorePlaylists}
      isSearching={isSearching}
      onSearch={onSearch}
      searchQuery={searchQuery}
    >
      {playlists.map((playlist, index) => {
        return (
          <PlaylistCarousel
            {...playlist}
            key={playlist.id}
            arrayIndex={index}
            userIsUploader={userId === playlist.uploaderId}
            showAllButton={playlist.showAllButton}
          />
        );
      })}
    </SectionPanel>
  );

  async function handleLoadMorePlaylists() {
    const { results, loadMoreButton } = stringIsEmpty(searchQuery)
      ? await loadPlaylists({ shownPlaylists: playlists })
      : await searchContent({
          filter: 'playlist',
          shownResults: playlists,
          searchText: searchQuery,
          limit: 3
        });
    onLoadMorePlaylists({
      playlists: results,
      isSearch: !!searchQuery,
      loadMoreButton
    });
  }
}
