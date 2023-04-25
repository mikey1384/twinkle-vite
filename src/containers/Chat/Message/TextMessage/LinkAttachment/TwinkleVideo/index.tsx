import React, { useEffect } from 'react';
import Loading from '~/components/Loading';
import XPVideoPlayer from '../../../XPVideoPlayer';
import TwinkleVideoLink from './TwinkleVideoLink';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

export default function TwinkleVideo({
  messageId,
  title,
  onPlay,
  style,
  videoId
}: {
  messageId: number;
  title: string;
  onPlay: () => void;
  style: React.CSSProperties;
  videoId: number;
}) {
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const { loaded, content, rewardLevel } = useContentState({
    contentId: videoId,
    contentType: 'video'
  });
  useEffect(() => {
    if (!loaded) {
      init();
    }
    async function init() {
      const data = await loadContent({
        contentId: videoId,
        contentType: 'video'
      });
      onInitContent({ ...data, contentType: 'video' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Chat/Message/TextMessage/LinkAttachment/TwinkleVideo">
      <div style={{ position: 'relative', ...style }}>
        {!loaded ? (
          <Loading style={{ height: '100%' }} />
        ) : deviceIsMobile ? (
          <TwinkleVideoLink
            rewardLevel={rewardLevel}
            title={title}
            messageId={messageId}
            videoCode={content}
            videoId={videoId}
          />
        ) : (
          <XPVideoPlayer
            loaded={loaded}
            style={{ width: '65rem', height: '100%' }}
            rewardLevel={rewardLevel}
            videoCode={content}
            videoId={videoId}
            onPlay={onPlay}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
