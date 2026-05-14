import React, { useMemo, useRef, useState, useEffect } from 'react';
import ContentPanel from '~/components/ContentPanel';
import InvalidPage from '~/components/InvalidPage';
import request from 'axios';
import URL from '~/constants/URL';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useParams, useLocation } from 'react-router-dom';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useContentState } from '~/helpers/hooks';
import { useScrollAnchorRestoration } from '~/helpers/hooks/useScrollAnchorRestoration';

export default function ContentPage() {
  const location = useLocation();
  const { contentId: initialContentId } = useParams();
  const contentId = Number(initialContentId);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const { contentType, rootType } = useMemo(() => {
    const rawContentType = location.pathname.split('/')[1].slice(0, -1);
    if (rawContentType === 'ai-storie') {
      return { contentType: 'aiStory', rootType: undefined };
    }
    if (rawContentType === 'mission-passe') {
      return { contentType: 'pass', rootType: 'mission' };
    }
    if (rawContentType === 'achievement-unlock') {
      return { contentType: 'pass', rootType: 'achievement' };
    }
    if (rawContentType === 'daily-reward') {
      return { contentType: 'xpChange', rootType: undefined };
    }
    if (rawContentType === 'shared-prompt') {
      return { contentType: 'sharedTopic', rootType: undefined };
    }
    if (rawContentType === 'daily-reflection') {
      return { contentType: 'dailyReflection', rootType: undefined };
    }
    return { contentType: rawContentType, rootType: undefined };
  }, [location.pathname]);
  const { isDeleted, isDeleteNotification } = useContentState({
    contentType,
    contentId
  });
  const [exists, setExists] = useState(true);
  const contentAnchorKey = `content:${rootType || 'root'}:${contentType}:${contentId}`;

  useScrollAnchorRestoration({
    anchorKey: contentAnchorKey,
    containerRef: pageRef,
    initialScroll: { type: 'top' },
    itemsReady: exists && !isDeleted && !isDeleteNotification
  });

  useEffect(() => {
    checkExists();
    async function checkExists() {
      try {
        const {
          data: { exists }
        } = await request.get(
          `${URL}/content/check?contentId=${contentId}&contentType=${contentType}${
            rootType ? `&rootType=${rootType}` : ''
          }`
        );
        setExists(exists);
      } catch (error) {
        console.error(error);
        setExists(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId, location.pathname, rootType]);

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
        ref={pageRef}
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
              min-height: auto;
            }
          `}
        >
          {exists && !isDeleted && !isDeleteNotification ? (
            <div
              data-scroll-anchor-id={contentAnchorKey}
              data-scroll-anchor-secondary-id={String(contentId)}
              data-scroll-anchor-content-key={`${contentType}:${contentId}`}
            >
              <ContentPanel
                key={contentType + contentId}
                isContentPage
                showActualDate
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
                rootType={rootType}
              />
            </div>
          ) : (
            <InvalidPage />
          )}
        </section>
      </div>
    </ErrorBoundary>
  );
}
