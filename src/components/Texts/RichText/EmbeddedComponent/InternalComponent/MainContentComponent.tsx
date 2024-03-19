import React, { useEffect, useRef, useState } from 'react';
import { useContentState } from '~/helpers/hooks';
import { useAppContext, useContentContext } from '~/contexts';
import XPVideoPlayer from '~/components/XPVideoPlayer';
import ContentListItem from '~/components/ContentListItem';
import Loading from '~/components/Loading';
import { isMobile } from '~/helpers';
import InvalidContent from '../InvalidContent';

const displayIsMobile = isMobile(navigator);

export default function MainContentComponent({
  contentId,
  contentType
}: {
  contentId: string;
  contentType: string;
}) {
  const [hasError, setHasError] = useState(false);
  const loadingRef = useRef(false);
  const contentState = useContentState({
    contentType: contentType === 'link' ? 'url' : contentType,
    contentId: Number(contentId)
  });
  const { loaded, content, notFound, rewardLevel } = contentState;
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);

  useEffect(() => {
    if (!loaded && !loadingRef.current && !isNaN(Number(contentId))) {
      onMount();
    }
    async function onMount() {
      try {
        loadingRef.current = true;
        const data = await loadContent({
          contentId,
          contentType: contentType === 'link' ? 'url' : contentType
        });
        if (data.notFound) {
          return setHasError(true);
        }
        onInitContent({
          ...data,
          feedId: contentState.feedId
        });
        if (data.rootObj) {
          onInitContent({
            contentId: data.rootId,
            contentType: data.rootType === 'url' ? 'link' : data.rootType,
            ...data.rootObj
          });
        }
      } catch (error) {
        setHasError(true);
      } finally {
        loadingRef.current = false;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  if (hasError || notFound || isNaN(Number(contentId))) {
    return <InvalidContent />;
  }
  if (!loaded) {
    return <Loading />;
  }
  switch (contentType) {
    case 'video':
      return (
        <XPVideoPlayer
          style={{ minWidth: displayIsMobile ? '100%' : '80%' }}
          isLink={displayIsMobile}
          videoId={Number(contentId)}
          videoCode={content}
          rewardLevel={rewardLevel}
        />
      );
    case 'link':
    case 'subject':
    case 'comment':
      return (
        <ContentListItem
          style={{ minWidth: displayIsMobile ? '100%' : '80%' }}
          contentObj={contentState}
        />
      );
    default:
      return <InvalidContent />;
  }
}
