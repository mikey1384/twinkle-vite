import React, { useEffect, useRef, useState } from 'react';
import { useSearch } from '~/helpers/hooks';
import SearchInput from '~/components/Texts/SearchInput';
import SelectUploadsForm from '~/components/Forms/SelectUploadsForm';
import ErrorBoundary from '~/components/ErrorBoundary';
import { objectify } from '~/helpers';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext, useContentContext } from '~/contexts';
import localize from '~/constants/localize';

const searchLabel = localize('search');

export default function SelectAttachmentScreen({
  onSelect,
  onDeselect,
  contentType
}: {
  onSelect: (arg0: any) => void;
  onDeselect: () => void;
  contentType: string;
}) {
  const loadUploads = useAppContext((v) => v.requestHelpers.loadUploads);
  const searchContent = useAppContext((v) => v.requestHelpers.searchContent);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const [allUploads, setAllUploads] = useState([]);
  const [loadMoreButton, setLoadMoreButton] = useState(false);
  const [searchedUploads, setSearchedUploads] = useState([]);
  const [searchLoadMoreButton, setSearchLoadMoreButton] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const contentObjs: React.RefObject<any> = useRef({});
  const { handleSearch, searching } = useSearch({
    onSearch,
    onClear: () => setSearchedUploads([]),
    onSetSearchText: setSearchText
  });

  useEffect(() => {
    initScreen();
    async function initScreen() {
      const { results, loadMoreButton } = await loadUploads({
        limit: 18,
        contentType
      });
      for (const result of results) {
        onInitContent({ contentId: result.id, contentType, ...result });
      }
      setAllUploads(results.map((result: { id: number }) => result.id));
      contentObjs.current = objectify(results);
      setLoadMoreButton(loadMoreButton);
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary
      componentPath="Home/Stories/InputPanel/SubjectInput/AttachContentModal/SelectAttachmentScreen"
      style={{ width: '100%' }}
    >
      <SearchInput
        placeholder={`${searchLabel}...`}
        autoFocus
        style={{
          marginBottom: '2em',
          width: '50%'
        }}
        value={searchText}
        onChange={handleSearch}
      />
      <SelectUploadsForm
        contentObjs={contentObjs.current}
        loading={!loaded || (!stringIsEmpty(searchText) && searching)}
        loadingMore={loadingMore}
        contentType={contentType}
        uploads={!stringIsEmpty(searchText) ? searchedUploads : allUploads}
        selectedUploads={selectedUpload}
        loadMoreButton={
          !stringIsEmpty(searchText) ? searchLoadMoreButton : loadMoreButton
        }
        onSelect={(uploadId) => {
          setSelectedUpload([uploadId]);
          onSelect(contentObjs.current[uploadId]);
        }}
        onDeselect={() => {
          setSelectedUpload([]);
          onDeselect();
        }}
        loadMoreUploads={loadMoreUploads}
      />
    </ErrorBoundary>
  );

  async function loadMoreUploads() {
    setLoadingMore(true);
    if (!stringIsEmpty(searchText)) {
      const { results, loadMoreButton } = await searchContent({
        filter: contentType,
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
        contentType,
        contentId: allUploads[allUploads.length - 1]
      });
      for (const result of results) {
        onInitContent({ contentId: result.id, contentType, ...result });
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
      filter: contentType,
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
}
