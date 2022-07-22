import React, { useEffect, useState } from 'react';
import { useAppContext } from '~/contexts';
import DeletedContent from './DeletedContent';
import Loading from '~/components/Loading';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const deletedPostsLabel = localize('deletedPosts');
const noNewlyDeletedPostsLabel = localize('noNewlyDeletedPosts');

export default function ModActivities() {
  const [loaded, setLoaded] = useState(false);
  const [deletedPosts, setDeletedPosts] = useState([]);
  const loadDeletedPosts = useAppContext(
    (v) => v.requestHelpers.loadDeletedPosts
  );
  useEffect(() => {
    init();
    async function init() {
      const data = await loadDeletedPosts();
      setDeletedPosts(data);
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={css`
        padding: 1rem;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0;
        }
      `}
    >
      <h2
        className={css`
          margin-top: 1rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 0 1rem;
            font-size: 2.3rem;
            margin-top: 2rem;
          }
        `}
      >
        {deletedPostsLabel}
      </h2>
      <div style={{ marginTop: '2rem' }}>
        {!loaded && <Loading />}
        {loaded && deletedPosts.length === 0 && (
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
            {noNewlyDeletedPostsLabel}
          </div>
        )}
        {deletedPosts.map((post, index) => (
          <DeletedContent
            key={post.id}
            onDeletePermanently={() =>
              setDeletedPosts((deletedPosts) =>
                deletedPosts.filter((deletedPost) => deletedPost.id !== post.id)
              )
            }
            postId={post.id}
            contentId={post.contentId}
            contentType={post.type}
            style={{ marginTop: index === 0 ? 0 : '1rem' }}
          />
        ))}
      </div>
      <div style={{ height: '10rem' }} />
    </div>
  );
}
