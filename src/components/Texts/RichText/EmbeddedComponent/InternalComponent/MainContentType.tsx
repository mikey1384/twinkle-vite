import React, { useEffect, useRef } from 'react';
import { useContentState } from '~/helpers/hooks';
import { useAppContext, useContentContext } from '~/contexts';
import XPVideoPlayer from '~/components/XPVideoPlayer';
import ContentListItem from '~/components/ContentListItem';
import { isMobile } from '~/helpers';

const displayIsMobile = isMobile(navigator);

export default function MainContentType({
  contentId,
  contentType
}: {
  contentId: string;
  contentType: string;
}) {
  const loadingRef = useRef(false);
  const contentState = useContentState({
    contentType: contentType === 'link' ? 'url' : contentType,
    contentId: Number(contentId)
  });
  const { loaded, content, rewardLevel } = contentState;
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  useEffect(() => {
    if (!loaded && !loadingRef.current && !isNaN(Number(contentId))) {
      onMount();
    }
    async function onMount() {
      loadingRef.current = true;
      const data = await loadContent({
        contentId,
        contentType: contentType === 'link' ? 'url' : contentType
      });
      onInitContent({
        ...data,
        feedId: contentState.feedId
      });
      if (data.rootObj) {
        onInitContent({
          contentId: data.rootId,
          contentType: data.rootType,
          ...data.rootObj
        });
      }
      loadingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  if (isNaN(Number(contentId))) {
    return <div>Invalid Content</div>;
  }
  switch (contentType) {
    case 'video':
      return (
        <XPVideoPlayer
          isLink={displayIsMobile}
          videoId={Number(contentId)}
          videoCode={content}
          rewardLevel={rewardLevel}
        />
      );
    case 'link':
    case 'subject':
      return <ContentListItem contentObj={contentState} />;
    default:
      return <div>Invalid Content</div>;
  }
}
