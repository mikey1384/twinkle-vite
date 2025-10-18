import React, { memo, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import TagForm from '~/components/Forms/TagForm';
import AddPlaylistModal from '~/components/Modals/AddPlaylistModal';
import { capitalize, hashify } from '~/helpers/stringHelpers';
import { useAppContext } from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';
import { Color } from '~/constants/css';

function TagModal({
  currentPlaylists,
  title,
  onAddPlaylist,
  onHide,
  onSubmit,
  videoId
}: {
  currentPlaylists: any[];
  title: string;
  onHide: () => any;
  videoId: number;
  onAddPlaylist: (playlist: any) => any;
  onSubmit: (playlists: any[]) => any;
}) {
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = useMemo(() => doneRole.getColor() || Color.blue(), [doneRole]);
  const addVideoToPlaylists = useAppContext(
    (v) => v.requestHelpers.addVideoToPlaylists
  );
  const searchContent = useAppContext((v) => v.requestHelpers.searchContent);
  const [addPlaylistModalShown, setAddPlaylistModalShown] = useState(false);
  const [notFoundMessageShown, setNotFoundMessageShown] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState([]);
  const [posting, setPosting] = useState(false);
  const InputRef: React.RefObject<any> = useRef(null);
  const searchTextRef = useRef('');
  const dropdownFooter = useMemo(
    () =>
      notFoundMessageShown ? (
        <a
          style={{ cursor: 'pointer', fontWeight: 'bold' }}
          onClick={() => {
            setSearchResults([]);
            setAddPlaylistModalShown(true);
          }}
        >
          {`Create a new playlist titled "${capitalize(searchText)}"`}
        </a>
      ) : null,
    [notFoundMessageShown, searchText]
  );

  return (
    <Modal wrapped onHide={onHide}>
      <header>{title}</header>
      <main>
        <TagForm
          autoFocus
          title="Search Playlists"
          subTitle="(e.g., crash course, story of the world)"
          dropdownFooter={dropdownFooter}
          inputRef={InputRef}
          itemLabel="title"
          searchResults={searchResults}
          filter={(result) => !currentPlaylists.includes(result.id)}
          onSearch={onSearchPlaylists}
          onClear={onClearSearchResults}
          onAddItem={(playlist) => {
            setAddPlaylistModalShown(false);
            setNotFoundMessageShown(false);
            setSelectedPlaylists(selectedPlaylists.concat(playlist));
          }}
          onNotFound={({ messageShown }) =>
            setNotFoundMessageShown(messageShown)
          }
          onRemoveItem={onRemovePlaylist}
          onSubmit={selectedPlaylists.length > 0 ? handleSubmit : undefined}
          renderDropdownLabel={(item) => <span>{item.title}</span>}
          renderTagLabel={(label) => hashify(label)}
          searchPlaceholder="Search for playlists here..."
          selectedItems={selectedPlaylists}
          style={{ width: '80%' }}
        />
        {addPlaylistModalShown && (
          <AddPlaylistModal
            modalOverModal
            existingVideoIds={[videoId]}
            onUploadPlaylist={handleAddPlaylist}
            onHide={() => {
              setNotFoundMessageShown(false);
              setAddPlaylistModalShown(false);
              InputRef.current.focus();
            }}
            title={searchText}
          />
        )}
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button
          disabled={selectedPlaylists.length === 0}
          loading={posting}
          color={doneColor}
          onClick={handleSubmit}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );

  function handleAddPlaylist(playlist: any) {
    onAddPlaylist({
      videoIds: playlist?.playlist
        ?.map((video: any) => video.videoId)
        ?.filter((id: number) => id !== videoId),
      playlistId: playlist.id,
      playlistTitle: playlist.title
    });
    setAddPlaylistModalShown(false);
    setNotFoundMessageShown(false);
    setSelectedPlaylists(selectedPlaylists.concat(playlist));
  }

  function onClearSearchResults() {
    setSearchResults([]);
  }

  function onRemovePlaylist(playlistId: number) {
    setSelectedPlaylists(
      selectedPlaylists.filter(
        (playlist: { id: number }) => playlist.id !== playlistId
      )
    );
  }

  async function handleSubmit() {
    setPosting(true);
    await addVideoToPlaylists({
      videoId,
      playlistIds: selectedPlaylists.map(
        (playlist: { id: number }) => playlist.id
      )
    });
    setSearchText('');
    onSubmit(selectedPlaylists);
  }

  async function onSearchPlaylists(text: string) {
    searchTextRef.current = text;
    const { results, searchText } = await searchContent({
      filter: 'playlist',
      searchText: text,
      limit: 5
    });
    if (searchTextRef.current === searchText) {
      setSearchText(searchText);
      setSearchResults(results);
    }
  }
}

export default memo(TagModal);
