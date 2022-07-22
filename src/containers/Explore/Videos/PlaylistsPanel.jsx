import React from 'react';
import PropTypes from 'prop-types';
import PlaylistCarousel from '../PlaylistCarousel';
import SectionPanel from '~/components/SectionPanel';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext, useExploreContext } from '~/contexts';
import localize from '~/constants/localize';

const noPlaylistsLabel = localize('noPlaylists');
const searchPlaylistsLabel = localize('searchPlaylists');
const allPlaylistsLabel = localize('allPlaylists');

PlaylistsPanel.propTypes = {
  buttonGroup: PropTypes.func,
  buttonGroupShown: PropTypes.bool,
  innerRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  isSearching: PropTypes.bool,
  loaded: PropTypes.bool.isRequired,
  loadMoreButton: PropTypes.bool,
  onSearch: PropTypes.func,
  playlists: PropTypes.array.isRequired,
  searchQuery: PropTypes.string,
  style: PropTypes.object,
  title: PropTypes.string.isRequired,
  userId: PropTypes.number
};

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
      isEmpty={playlists.length === 0}
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
