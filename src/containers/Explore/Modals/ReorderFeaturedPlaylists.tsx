import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SortableListGroup from '~/components/SortableListGroup';
import { objectify } from '~/helpers';
import { isEqual } from 'lodash';
import { useAppContext, useExploreContext, useKeyContext } from '~/contexts';

export default function ReorderFeaturedPlaylists({
  onHide,
  playlistIds: initialPlaylistIds
}: {
  onHide: () => void;
  playlistIds: number[];
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const uploadFeaturedPlaylists = useAppContext(
    (v) => v.requestHelpers.uploadFeaturedPlaylists
  );
  const featuredPlaylists = useExploreContext(
    (v) => v.state.videos.featuredPlaylists
  );
  const onChangeFeaturedPlaylists = useExploreContext(
    (v) => v.actions.onChangeFeaturedPlaylists
  );
  const [playlistIds, setPlaylistIds] = useState(initialPlaylistIds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const listItemObj = objectify(featuredPlaylists);

  return (
    <Modal onHide={onHide}>
      <header>Reorder Featured Playlists</header>
      <main>
        <SortableListGroup
          listItemLabel="title"
          listItemObj={listItemObj}
          onMove={handleMove}
          itemIds={playlistIds}
        />
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          disabled={isEqual(
            playlistIds,
            featuredPlaylists.map((playlist: { id: number }) => playlist.id)
          )}
          loading={isSubmitting}
          color={doneColor}
          onClick={handleSubmit}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );

  function handleMove({
    sourceId,
    targetId
  }: {
    sourceId: number;
    targetId: number;
  }) {
    const sourceIndex = playlistIds.indexOf(sourceId);
    const targetIndex = playlistIds.indexOf(targetId);
    const newPlaylistIds = [...playlistIds];
    newPlaylistIds.splice(sourceIndex, 1);
    newPlaylistIds.splice(targetIndex, 0, sourceId);
    setPlaylistIds(newPlaylistIds);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    const newSelectedPlaylists = await uploadFeaturedPlaylists({
      selectedPlaylists: playlistIds
    });
    onChangeFeaturedPlaylists(newSelectedPlaylists);
    onHide();
  }
}
