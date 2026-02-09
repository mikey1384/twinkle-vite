import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '~/contexts';
import DeletedPost from '~/components/Deleted/DeletedPost';
import DeletedMessage from '~/components/Deleted/DeletedMessage';
import Loading from '~/components/Loading';
import FilterBar from '~/components/FilterBar';
import Button from '~/components/Button';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function ModActivities() {
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState('post');
  const [deletedPosts, setDeletedPosts] = useState<any[]>([]);
  const [deletedMessages, setDeletedMessages] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<{
    status: number;
    message: string;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const loadDeletedPosts = useAppContext(
    (v) => v.requestHelpers.loadDeletedPosts
  );
  useEffect(() => {
    let canceled = false;
    init();
    async function init() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await loadDeletedPosts(contentType);
        if (canceled) return;
        const safeData = Array.isArray(data) ? data : [];
        if (contentType === 'post') {
          setDeletedPosts(safeData);
        } else {
          setDeletedMessages(safeData);
        }
      } catch (error: any) {
        if (canceled) return;
        const message = typeof error?.message === 'string' ? error.message : '';
        const status = typeof error?.status === 'number' ? error.status : 500;
        const normalized = message.trim().toLowerCase();
        const isCanceled =
          normalized === 'canceled' ||
          normalized === 'cancelled' ||
          normalized.includes('timeout');
        setLoadError({
          status,
          message: isCanceled
            ? 'Loading took too long. Please try again.'
            : message || 'Failed to load deleted content'
        });
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
            setContentType('post');
          }}
        >
          Posts
        </nav>
        <nav
          className={contentType === 'message' ? 'active' : ''}
          onClick={() => {
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
      </div>
      <div style={{ height: '10rem' }} />
    </div>
  );

  function handleRetry() {
    setReloadKey((prev) => prev + 1);
  }
}
