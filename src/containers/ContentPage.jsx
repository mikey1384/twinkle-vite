import { useState, useRef, useEffect } from 'react';
import ContentPanel from '~/components/ContentPanel';
import InvalidPage from '~/components/InvalidPage';
import request from 'axios';
import URL from '~/constants/URL';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useContentState } from '~/helpers/hooks';
import { useViewContext, useKeyContext } from '~/contexts';

export default function ContentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { contentId: initialContentId } = useParams();
  const contentId = Number(initialContentId);
  const { userId } = useKeyContext((v) => v.myState);
  const onSetContentNav = useViewContext((v) => v.actions.onSetContentNav);
  const contentType = location.pathname.split('/')[1].slice(0, -1);
  const { loaded, isDeleted, isDeleteNotification } = useContentState({
    contentType,
    contentId
  });
  const [exists, setExists] = useState(true);
  const prevDeleted = useRef(false);

  useEffect(() => {
    if (!prevDeleted.current && (isDeleted || isDeleteNotification)) {
      onSetContentNav('');
      navigate('/');
    }
    prevDeleted.current = isDeleted || isDeleteNotification;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeleted, isDeleteNotification, loaded]);

  useEffect(() => {
    if (!loaded) {
      initContent();
    }
    async function initContent() {
      try {
        const {
          data: { exists }
        } = await request.get(
          `${URL}/content/check?contentId=${contentId}&contentType=${contentType}`
        );
        setExists(exists);
      } catch (error) {
        console.error(error);
        setExists(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId, location.pathname]);

  return (
    <ErrorBoundary
      componentPath="ContentPage"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}
    >
      <div
        className={css`
          width: 100%;
          display: flex;
          justify-content: center;
          margin-bottom: 1rem;
          padding-bottom: 20rem;
        `}
      >
        <section
          className={css`
            width: 65%;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
              min-height: 100vh;
            }
          `}
        >
          {exists ? (
            <ContentPanel
              key={contentType + contentId}
              className={css`
                margin-top: 1rem;
                @media (max-width: ${mobileMaxWidth}) {
                  margin-top: 0;
                }
              `}
              autoExpand
              commentsLoadLimit={5}
              contentId={Number(contentId)}
              contentType={contentType}
              userId={userId}
            />
          ) : (
            <InvalidPage />
          )}
        </section>
      </div>
    </ErrorBoundary>
  );
}
