import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SelectUploadsForm from '~/components/Forms/SelectUploadsForm';
import SearchInput from '~/components/Texts/SearchInput';
import { objectify } from '~/helpers';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import { useSearch } from '~/helpers/hooks';

export default function SelectVideoModal({
  isOpen = true,
  onDone,
  onHide
}: {
  isOpen?: boolean;
  onDone: (arg0: { videoId: number }) => void;
  onHide: () => void;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const loadUploads = useAppContext((v) => v.requestHelpers.loadUploads);
  const searchContent = useAppContext((v) => v.requestHelpers.searchContent);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const [searchedUploads, setSearchedUploads] = useState([]);
  const [selectedUpload, setSelectedUpload] = useState<any[]>([]);
  const [allUploads, setAllUploads] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadMoreButton, setLoadMoreButton] = useState(false);
  const [searchLoadMoreButton, setSearchLoadMoreButton] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { handleSearch, searching } = useSearch({
    onSearch,
    onClear: () => setSearchedUploads([]),
    onSetSearchText: setSearchText
  });
  const contentObjs = useRef({});

  useEffect(() => {
    initScreen();
    async function initScreen() {
      const { results, loadMoreButton } = await loadUploads({
        limit: 18,
        contentType: 'video'
      });
      for (const result of results) {
        onInitContent({
          contentId: result.id,
          contentType: 'video',
          ...result
        });
      }
      setAllUploads(results.map((result: { id: number }) => result.id));
      contentObjs.current = objectify(results);
      setLoadMoreButton(loadMoreButton);
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onHide}
      title="Attach a Video"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button
            disabled={selectedUpload.length === 0}
            color={doneColor}
            onClick={handleDoneClick}
          >
            Done
          </Button>
        </>
      }
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}
      >
        <SearchInput
          placeholder="Search..."
          autoFocus
          style={{
            marginBottom: 0
          }}
          value={searchText}
          onChange={handleSearch}
        />
        <SelectUploadsForm
          contentObjs={contentObjs.current}
          loading={!loaded || (!stringIsEmpty(searchText) && searching)}
          loadingMore={loadingMore}
          contentType="video"
          uploads={!stringIsEmpty(searchText) ? searchedUploads : allUploads}
          selectedUploads={selectedUpload}
          loadMoreButton={
            !stringIsEmpty(searchText) ? searchLoadMoreButton : loadMoreButton
          }
          onSelect={(uploadId) => {
            setSelectedUpload([uploadId]);
          }}
          onDeselect={() => {
            setSelectedUpload([]);
          }}
          loadMoreUploads={loadMoreUploads}
        />
      </div>
    </Modal>
  );

  async function loadMoreUploads() {
    setLoadingMore(true);
    if (!stringIsEmpty(searchText)) {
      const { results, loadMoreButton } = await searchContent({
        filter: 'video',
        searchText,
        shownResults: searchedUploads.map(
          (uploadId) => contentObjs.current[uploadId]
        )
      });
      contentObjs.current = {
        ...contentObjs.current,
        ...objectify(results)
      };
      setSearchedUploads((searchedUploads) =>
        searchedUploads.concat(
          results.map((result: { id: number }) => result.id)
        )
      );
      setLoadingMore(false);
      setSearchLoadMoreButton(loadMoreButton);
    } else {
      const { results, loadMoreButton } = await loadUploads({
        limit: 18,
        contentType: 'video',
        contentId: allUploads[allUploads.length - 1]
      });
      for (const result of results) {
        onInitContent({
          contentId: result.id,
          contentType: 'video',
          ...result
        });
      }
      contentObjs.current = {
        ...contentObjs.current,
        ...objectify(results)
      };
      setAllUploads((allUploads) =>
        allUploads.concat(results.map((result: { id: number }) => result.id))
      );
      setLoadingMore(false);
      setLoadMoreButton(loadMoreButton);
    }
  }

  async function onSearch(text: string) {
    const { results: searchedUploads, loadMoreButton } = await searchContent({
      filter: 'video',
      searchText: text
    });
    contentObjs.current = {
      ...contentObjs.current,
      ...objectify(searchedUploads)
    };
    setSearchedUploads(
      searchedUploads.map((upload: { id: number }) => upload.id)
    );
    setSearchLoadMoreButton(loadMoreButton);
  }

  function handleDoneClick() {
    const videoId = selectedUpload?.[0];
    if (!videoId) return;
    onDone({ videoId });
    onHide();
  }
}
