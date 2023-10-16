import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '~/contexts';
import DeletedPost from '~/components/Deleted/DeletedPost';
import DeletedMessage from '~/components/Deleted/DeletedMessage';
import Loading from '~/components/Loading';
import FilterBar from '~/components/FilterBar';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function ModActivities() {
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState('post');
  const [deletedPosts, setDeletedPosts] = useState([]);
  const [deletedMessages, setDeletedMessages] = useState([]);
  const loadDeletedPosts = useAppContext(
    (v) => v.requestHelpers.loadDeletedPosts
  );
  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const data = await loadDeletedPosts(contentType);
        if (contentType === 'post') {
          setDeletedPosts(data);
        } else {
          setDeletedMessages(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);

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
      <FilterBar
        bordered
        className={css`
          font-size: 1.5rem !important;
          height: 4.5rem !important;
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.1rem !important;
            height: 3rem !important;
          }
        `}
      >
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
        {!loading && deletedContents.length === 0 && (
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
        {deletedContents.map(
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
                      (deletedPost: { id: number }) => deletedPost.id !== postId
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
}
