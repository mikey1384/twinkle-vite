import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import XPVideoPlayer from '../../../XPVideoPlayer';
import TwinkleVideoLink from './TwinkleVideoLink';
import { useAppContext, useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

TwinkleVideo.propTypes = {
  messageId: PropTypes.number.isRequired,
  onPlay: PropTypes.func,
  style: PropTypes.object,
  title: PropTypes.string,
  videoId: PropTypes.number.isRequired
};

export default function TwinkleVideo({
  messageId,
  title,
  onPlay,
  style,
  videoId
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
  );
}
