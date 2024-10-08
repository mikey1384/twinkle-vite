import React, { useEffect, useMemo, useRef } from 'react';
import PlaylistsPanel from './PlaylistsPanel';
import ErrorBoundary from '~/components/ErrorBoundary';
import ButtonGroup from '~/components/Buttons/ButtonGroup';
import SelectFeaturedPlaylists from '../Modals/SelectFeaturedPlaylists';
import ReorderFeaturedPlaylists from '../Modals/ReorderFeaturedPlaylists';
import { useAppContext, useExploreContext, useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const featuredPlaylistsLabel = localize('featuredPlaylists');
const selectLabel = localize('select');
const reorderLabel = localize('reorder');

export default function FeaturedPlaylistsPanel() {
  const loadFeaturedPlaylists = useAppContext(
    (v) => v.requestHelpers.loadFeaturedPlaylists
  );
  const loadPlaylistList = useAppContext(
    (v) => v.requestHelpers.loadPlaylistList
  );
  const { canPinPlaylists, userId } = useKeyContext((v) => v.myState);
  const featuredPlaylists = useExploreContext(
    (v) => v.state.videos.featuredPlaylists
  );
  const featuredPlaylistsLoaded = useExploreContext(
    (v) => v.state.videos.featuredPlaylistsLoaded
  );
  const reorderFeaturedPlaylistsShown = useExploreContext(
    (v) => v.state.videos.reorderFeaturedPlaylistsShown
  );
  const selectFeaturedPlaylistsModalShown = useExploreContext(
    (v) => v.state.videos.selectFeaturedPlaylistsModalShown
  );
  const prevUserId = useExploreContext((v) => v.state.prevUserId);
  const onCloseReorderFeaturedPlaylists = useExploreContext(
    (v) => v.actions.onCloseReorderFeaturedPlaylists
  );
  const onCloseSelectFeaturedPlaylists = useExploreContext(
    (v) => v.actions.onCloseSelectFeaturedPlaylists
  );
  const onLoadFeaturedPlaylists = useExploreContext(
    (v) => v.actions.onLoadFeaturedPlaylists
  );
  const onOpenReorderFeaturedPlaylists = useExploreContext(
    (v) => v.actions.onOpenReorderFeaturedPlaylists
  );
  const onOpenSelectFeaturedPlaylists = useExploreContext(
    (v) => v.actions.onOpenSelectFeaturedPlaylists
  );

  const loadedRef = useRef(false);
  useEffect(() => {
    if (
      !(featuredPlaylistsLoaded || loadedRef.current) ||
      userId !== prevUserId
    ) {
      init();
    }
    async function init() {
      const playlists = await loadFeaturedPlaylists();
      onLoadFeaturedPlaylists(playlists);
      loadedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredPlaylistsLoaded, userId, prevUserId]);

  const menuButtons = useMemo(() => {
    const buttons = [
      {
        label: selectLabel,
        onClick: handleOpenSelectPlaylistsToPinModal,
        skeuomorphic: true,
        color: 'darkerGray'
      }
    ];
    if (featuredPlaylists?.length) {
      buttons.push({
        label: reorderLabel,
        onClick: onOpenReorderFeaturedPlaylists,
        skeuomorphic: true,
        color: 'darkerGray'
      });
    }
    return buttons;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredPlaylists?.length]);

  return (
    <ErrorBoundary componentPath="Explore/Videos/FeaturedPlaylistsPanel">
      <PlaylistsPanel
        buttonGroupShown={!!canPinPlaylists}
        buttonGroup={() => (
          <ButtonGroup style={{ marginLeft: 'auto' }} buttons={menuButtons} />
        )}
        title={featuredPlaylistsLabel}
        userId={userId}
        playlists={featuredPlaylists}
        loaded={featuredPlaylistsLoaded || loadedRef.current}
      />
      {selectFeaturedPlaylistsModalShown && (
        <SelectFeaturedPlaylists
          selectedPlaylists={featuredPlaylists.map(
            (playlist: { id: number }) => {
              return playlist.id;
            }
          )}
          onHide={onCloseSelectFeaturedPlaylists}
        />
      )}
      {reorderFeaturedPlaylistsShown && (
        <ReorderFeaturedPlaylists
          playlistIds={featuredPlaylists.map(
            (playlist: { id: number }) => playlist.id
          )}
          onHide={onCloseReorderFeaturedPlaylists}
        />
      )}
    </ErrorBoundary>
  );

  async function handleOpenSelectPlaylistsToPinModal() {
    const data = await loadPlaylistList();
    onOpenSelectFeaturedPlaylists(data);
  }
}
