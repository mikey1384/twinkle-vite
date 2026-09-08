import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SelectUploadsForm from '~/components/Forms/SelectUploadsForm';
import { useAppContext, useContentContext, useKeyContext } from '~/contexts';
import useScopedRead from '~/helpers/hooks/useScopedRead';
import readWithTimeout from '~/helpers/readWithTimeout';

export default function SelectVideoModal({
  isOpen = true,
  onDone,
  onHide
}: {
  isOpen?: boolean;
  onDone: (value: { videoId: number }) => void;
  onHide: () => void;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  return isOpen ? (
    <VideoPicker key={userId} onDone={onDone} onHide={onHide} />
  ) : null;
}

function validatePage(value: any) {
  if (
    !Array.isArray(value?.results) ||
    !value.results.every(
      (item: any) =>
        Number.isSafeInteger(Number(item?.id)) &&
        Number(item.id) > 0 &&
        typeof item.title === 'string'
    )
  )
    throw new Error('Invalid video list');
  return {
    results: value.results.map((item: any) => ({
      ...item,
      id: Number(item.id)
    })),
    more: Boolean(value.loadMoreButton)
  };
}

export function VideoPicker({
  onDone,
  onHide
}: {
  onDone: (value: { videoId: number }) => void;
  onHide: () => void;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const loadUploads = useAppContext((v) => v.requestHelpers.loadUploads);
  const searchContent = useAppContext((v) => v.requestHelpers.searchContent);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [extra, setExtra] = useState<{
    base: any;
    results: any[];
    more: boolean;
  } | null>(null);
  const [pageError, setPageError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pending = useRef(false);
  const generation = useRef(0);
  const latestSearch = useRef(search);
  latestSearch.current = search;
  const list = useScopedRead(
    search,
    async () =>
      validatePage(
        search
          ? await searchContent({ filter: 'video', searchText: search })
          : await loadUploads({ limit: 18, contentType: 'video' })
      ),
    search ? 350 : 0
  );
  const page = extra?.base === list.data ? extra : list.data;
  const results: any[] = page?.results || [];
  const objects = Object.fromEntries(results.map((item) => [item.id, item]));
  useEffect(() => {
    generation.current++;
    pending.current = false;
    setLoadingMore(false);
    setPageError(false);
    setSelected(null);
    setExtra(null);
    return () => {
      generation.current++;
    };
  }, [search, list.data]);
  const actionStyle = { minHeight: 44, fontSize: 14 };
  return (
    <Modal
      modalKey="SelectVideoModal"
      isOpen
      onClose={onHide}
      title="Attach a Video"
      size="lg"
      aria-label="Attach a video"
      footer={
        <>
          <Button variant="ghost" style={actionStyle} onClick={onHide}>
            Cancel
          </Button>
          <Button
            style={actionStyle}
            color={doneColor}
            disabled={
              !selected || list.loading || composing || query.trim() !== search
            }
            onClick={() => {
              if (
                !selected ||
                list.loading ||
                composing ||
                query.trim() !== search ||
                !objects[selected]
              )
                return;
              onInitContent({
                ...objects[selected],
                contentType: 'video',
                contentId: selected
              });
              onDone({ videoId: selected });
              onHide();
            }}
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
          gap: 16
        }}
      >
        <label style={{ fontSize: 16 }}>
          Search videos
          <input
            type="search"
            autoFocus
            value={query}
            style={{ width: '100%', minHeight: 44, fontSize: 16 }}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={(event) => {
              setComposing(false);
              setSearch(event.currentTarget.value.trim());
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              if (!composing) setSearch(event.target.value.trim());
            }}
          />
        </label>
        {list.error ? (
          <div role="alert" style={{ fontSize: 16 }}>
            Could not load videos. Your search is still here.
            <Button style={actionStyle} variant="ghost" onClick={list.retry}>
              Try again
            </Button>
          </div>
        ) : (
          <SelectUploadsForm
            contentObjs={objects}
            contentType="video"
            loading={list.loading}
            uploads={results.map((item) => item.id)}
            selectedUploads={selected ? [selected] : []}
            onSelect={(id) => setSelected(Number(id))}
            onDeselect={() => setSelected(null)}
            loadingMore={loadingMore}
            loadMoreButton={page?.more && !pageError}
            loadMoreUploads={loadMore}
          />
        )}
        {pageError && (
          <div role="alert" style={{ fontSize: 16 }}>
            Could not load more videos. Your current results are kept.
            <Button
              style={actionStyle}
              variant="ghost"
              disabled={loadingMore}
              onClick={loadMore}
            >
              Try loading more again
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );

  async function loadMore() {
    if (pending.current || list.loading || !page?.more) return;
    pending.current = true;
    setLoadingMore(true);
    setPageError(false);
    const version = generation.current;
    const current = () =>
      version === generation.current && latestSearch.current === search;
    try {
      const response = validatePage(
        await readWithTimeout(() =>
          search
            ? searchContent({
                filter: 'video',
                searchText: search,
                shownResults: results
              })
            : loadUploads({
                limit: 18,
                contentType: 'video',
                contentId: results.at(-1)?.id
              })
        )
      );
      if (current())
        setExtra({
          base: list.data,
          results: [
            ...new Map(
              [...results, ...response.results].map((item) => [item.id, item])
            ).values()
          ],
          more: response.more
        });
    } catch {
      if (current()) setPageError(true);
    } finally {
      if (current()) {
        pending.current = false;
        setLoadingMore(false);
      }
    }
  }
}
