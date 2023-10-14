import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '~/contexts';
import DeletedPost from './DeletedPost';
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
          (post: { id: number; contentId: number; type: string }, index) =>
            contentType === 'post' ? (
              <DeletedPost
                key={post.id}
                onDeletePermanently={() =>
                  setDeletedPosts((deletedPosts) =>
                    deletedPosts.filter(
                      (deletedPost: { id: number }) =>
                        deletedPost.id !== post.id
                    )
                  )
                }
                postId={post.id}
                contentId={post.contentId}
                contentType={post.type}
                style={{ marginTop: index === 0 ? 0 : '1rem' }}
              />
            ) : (
              <div key={post.id}>{post.content}</div>
            )
        )}
      </div>
      <div style={{ height: '10rem' }} />
    </div>
  );
}
