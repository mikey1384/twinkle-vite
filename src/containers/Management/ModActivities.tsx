import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '~/contexts';
import DeletedPost from '~/components/Deleted/DeletedPost';
import DeletedMessage from '~/components/Deleted/DeletedMessage';
import Loading from '~/components/Loading';
import FilterBar from '~/components/FilterBar';
import Button from '~/components/Button';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

type ContentType = 'post' | 'message';
interface PaginationCursor {
  timeStamp: number;
  id: number;
}
const PAGE_SIZE = 20;

export default function ModActivities() {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [contentType, setContentType] = useState<ContentType>('post');
  const [deletedPosts, setDeletedPosts] = useState<any[]>([]);
  const [deletedMessages, setDeletedMessages] = useState<any[]>([]);
  const [hasMoreByType, setHasMoreByType] = useState<
    Record<ContentType, boolean>
  >({
    post: false,
    message: false
  });
  const [nextOffsetByType, setNextOffsetByType] = useState<
    Record<ContentType, number>
  >({
    post: 0,
    message: 0
  });
  const [nextCursorByType, setNextCursorByType] = useState<
    Record<ContentType, PaginationCursor | null>
  >({
    post: null,
    message: null
  });
  const [loadedRevisionByType, setLoadedRevisionByType] = useState<
    Record<ContentType, number>
  >({
    post: -1,
    message: -1
  });
  const [loadErrorByType, setLoadErrorByType] = useState<
    Record<
      ContentType,
      {
        status: number;
        message: string;
      } | null
    >
  >({
    post: null,
    message: null
  });
  const [reloadKey, setReloadKey] = useState(0);
  const loadDeletedPosts = useAppContext(
    (v) => v.requestHelpers.loadDeletedPosts
  );
  useEffect(() => {
    let canceled = false;
    const alreadyLoadedForCurrentRevision =
      loadedRevisionByType[contentType] === reloadKey;
    if (alreadyLoadedForCurrentRevision) {
      setLoadErrorByType((prev) => ({
        ...prev,
        [contentType]: null
      }));
      setLoading(false);
      return () => {
        canceled = true;
      };
    }
    void init();
    async function init() {
      setLoading(true);
      setLoadErrorByType((prev) => ({
        ...prev,
        [contentType]: null
      }));
      try {
        const data = await loadDeletedPosts({
          contentType,
          limit: PAGE_SIZE,
          offset: 0
        });
        if ((data as any)?.error) {
          throw data;
        }
        if (canceled) return;
        const safeData = Array.isArray((data as any)?.items)
          ? (data as any).items
          : [];
        if (contentType === 'post') {
          setDeletedPosts(safeData);
        } else {
          setDeletedMessages(safeData);
        }
        setHasMoreByType((prev) => ({
          ...prev,
          [contentType]: !!(data as any)?.hasMore
        }));
        setNextOffsetByType((prev) => ({
          ...prev,
          [contentType]:
            typeof (data as any)?.nextOffset === 'number'
              ? (data as any).nextOffset
              : safeData.length
        }));
        setNextCursorByType((prev) => ({
          ...prev,
          [contentType]: getValidCursor((data as any)?.nextCursor)
        }));
        setLoadedRevisionByType((prev) => ({
          ...prev,
          [contentType]: reloadKey
        }));
      } catch (error: any) {
        if (canceled) return;
        const message = typeof error?.message === 'string' ? error.message : '';
        const status = typeof error?.status === 'number' ? error.status : 500;
        const normalized = message.trim().toLowerCase();
        const isCanceled =
          normalized === 'canceled' ||
          normalized === 'cancelled' ||
          normalized.includes('timeout');
        setLoadErrorByType((prev) => ({
          ...prev,
          [contentType]: {
            status,
            message: isCanceled
              ? 'Loading took too long. Please try again.'
              : message || 'Failed to load deleted content'
          }
        }));
        console.error(error);
      } finally {
        if (canceled) return;
        setLoading(false);
      }
    }
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, reloadKey]);

  const deletedContents = useMemo(() => {
    if (contentType === 'post') {
      return deletedPosts;
    }
    return deletedMessages;
  }, [contentType, deletedMessages, deletedPosts]);
  const loadError = loadErrorByType[contentType];

  return (
    <div
      className={css`
        padding: 1rem;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0;
        }
      `}
    >
      <FilterBar>
        <nav
          className={contentType === 'post' ? 'active' : ''}
          onClick={() => {
            if (contentType === 'post') return;
            setContentType('post');
          }}
        >
          Posts
        </nav>
        <nav
          className={contentType === 'message' ? 'active' : ''}
          onClick={() => {
            if (contentType === 'message') return;
            setContentType('message');
          }}
        >
          Messages
        </nav>
      </FilterBar>
      <div style={{ marginTop: '2rem' }}>
        {loading && <Loading />}
        {!loading && loadError && (
          <div
            style={{
              width: '100%',
              height: '25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 'bold',
              fontSize: '2rem',
              textAlign: 'center'
            }}
          >
            <div>{`Failed to load deleted ${contentType}s`}</div>
            <div style={{ marginTop: '1rem', fontSize: '1.5rem' }}>
              {loadError.message}
            </div>
            <Button
              style={{ marginTop: '2rem' }}
              color="darkerGray"
              variant="soft"
              onClick={handleRetry}
            >
              Retry
            </Button>
          </div>
        )}
        {!loading && !loadError && deletedContents.length === 0 && (
          <div
            style={{
              width: '100%',
              height: '25rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 'bold',
              fontSize: '2rem'
            }}
          >
            {`No deleted ${contentType}s`}
          </div>
        )}
        {!loading &&
          !loadError &&
          deletedContents.map(
            (
              deletedContent: { id: number; contentId: number; type: string },
              index
            ) =>
              contentType === 'post' ? (
                <DeletedPost
                  key={deletedContent.id}
                  onDeletePermanently={(postId) =>
                    setDeletedPosts((deletedPosts) =>
                      deletedPosts.filter(
                        (deletedPost: { id: number }) =>
                          deletedPost.id !== postId
                      )
                    )
                  }
                  postId={deletedContent.id}
                  contentId={deletedContent.contentId}
                  contentType={deletedContent.type}
                  style={{ marginTop: index === 0 ? 0 : '1rem' }}
                />
              ) : (
                <DeletedMessage
                  key={deletedContent.id}
                  messageId={deletedContent.id}
                  message={deletedContent as any}
                  onDeletePermanently={(messageId) => {
                    setDeletedMessages((deletedMessages) =>
                      deletedMessages.filter(
                        (deletedMessage: { id: number }) =>
                          deletedMessage.id !== messageId
                      )
                    );
                  }}
                />
              )
          )}
        {!loading && !loadError && hasMoreByType[contentType] && (
          <div
            style={{
              marginTop: '1.5rem',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Button
              color="darkerGray"
              variant="soft"
              loading={loadingMore}
              disabled={loadingMore}
              onClick={handleLoadMore}
            >
              Load More
            </Button>
          </div>
        )}
      </div>
      <div style={{ height: '10rem' }} />
    </div>
  );

  function handleRetry() {
    setLoadErrorByType((prev) => ({
      ...prev,
      [contentType]: null
    }));
    if (contentType === 'post') {
      setDeletedPosts([]);
    } else {
      setDeletedMessages([]);
    }
    setHasMoreByType((prev) => ({ ...prev, [contentType]: false }));
    setNextOffsetByType((prev) => ({ ...prev, [contentType]: 0 }));
    setNextCursorByType((prev) => ({ ...prev, [contentType]: null }));
    setLoadedRevisionByType((prev) => ({ ...prev, [contentType]: -1 }));
    setReloadKey((prev) => prev + 1);
  }

  async function handleLoadMore() {
    if (loadingMore || loading || !hasMoreByType[contentType]) return;
    setLoadingMore(true);
    try {
      const nextCursor = getValidCursor(nextCursorByType[contentType]);
      const data = await loadDeletedPosts({
        contentType,
        limit: PAGE_SIZE,
        ...(nextCursor
          ? { cursor: nextCursor }
          : { offset: nextOffsetByType[contentType] })
      });
      if ((data as any)?.error) {
        throw data;
      }
      const safeData = Array.isArray((data as any)?.items)
        ? (data as any).items
        : [];
      if (contentType === 'post') {
        setDeletedPosts((prev) => [...prev, ...safeData]);
      } else {
        setDeletedMessages((prev) => [...prev, ...safeData]);
      }
      setHasMoreByType((prev) => ({
        ...prev,
        [contentType]: !!(data as any)?.hasMore
      }));
      setNextOffsetByType((prev) => ({
        ...prev,
        [contentType]:
          typeof (data as any)?.nextOffset === 'number'
            ? (data as any).nextOffset
            : prev[contentType] + safeData.length
      }));
      setNextCursorByType((prev) => ({
        ...prev,
        [contentType]: getValidCursor((data as any)?.nextCursor)
      }));
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }

  function getValidCursor(cursor: any): PaginationCursor | null {
    const timeStamp = Number(cursor?.timeStamp);
    const id = Number(cursor?.id);
    if (
      !Number.isFinite(timeStamp) ||
      timeStamp <= 0 ||
      !Number.isFinite(id) ||
      id <= 0
    ) {
      return null;
    }
    return {
      timeStamp: Math.floor(timeStamp),
      id: Math.floor(id)
    };
  }
}
