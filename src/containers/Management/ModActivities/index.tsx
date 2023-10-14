import React, { useEffect, useState } from 'react';
import { useAppContext } from '~/contexts';
import DeletedContent from './DeletedContent';
import Loading from '~/components/Loading';
import FilterBar from '~/components/FilterBar';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function ModActivities() {
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState('post');
  const [deletedPosts, setDeletedPosts] = useState([]);
  const loadDeletedPosts = useAppContext(
    (v) => v.requestHelpers.loadDeletedPosts
  );
  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const data = await loadDeletedPosts();
        setDeletedPosts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);

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
        {!loading && deletedPosts.length === 0 && (
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
        {deletedPosts.map(
          (post: { id: number; contentId: number; type: string }, index) => (
            <DeletedContent
              key={post.id}
              onDeletePermanently={() =>
                setDeletedPosts((deletedPosts) =>
                  deletedPosts.filter(
                    (deletedPost: { id: number }) => deletedPost.id !== post.id
                  )
                )
              }
              postId={post.id}
              contentId={post.contentId}
              contentType={post.type}
              style={{ marginTop: index === 0 ? 0 : '1rem' }}
            />
          )
        )}
      </div>
      <div style={{ height: '10rem' }} />
    </div>
  );
}
