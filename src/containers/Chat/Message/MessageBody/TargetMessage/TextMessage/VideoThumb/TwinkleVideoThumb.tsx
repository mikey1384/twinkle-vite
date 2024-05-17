import React, { useEffect, useMemo, useState } from 'react';
import VideoThumbImage from '~/components/VideoThumbImage';
import Loading from '~/components/Loading';
import TwinkleVideoModal from '../../../TwinkleVideoModal';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext, useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { extractVideoIdFromTwinkleVideoUrl } from '~/helpers/stringHelpers';

export default function TwinkleVideoThumb({
  messageId,
  videoUrl
}: {
  messageId: number;
  videoUrl: string;
}) {
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const loadContent = useAppContext((v) => v.requestHelpers.loadContent);
  const [modalShown, setModalShown] = useState(false);
  const videoId = useMemo(
    () => extractVideoIdFromTwinkleVideoUrl(videoUrl),
    [videoUrl]
  );
  const { content, rewardLevel, notFound, loaded } = useContentState({
    contentId: Number(videoId),
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
      onInitContent(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  return notFound ? null : (
    <div
      className={css`
        position: relative;
        width: 100%;
        height: 10rem;
        display: flex;
        align-items: center;
        @media (max-width: ${mobileMaxWidth}) {
          height: 5rem;
        }
      `}
    >
      {content ? (
        <VideoThumbImage
          noPaddingBottom
          style={{ height: '100%', cursor: 'pointer' }}
          rewardLevel={rewardLevel}
          videoId={Number(videoId)}
          src={`https://img.youtube.com/vi/${content}/mqdefault.jpg`}
          onClick={() => setModalShown(true)}
        />
      ) : (
        <Loading style={{ position: 'absolute' }} />
      )}
      {modalShown && (
        <TwinkleVideoModal
          messageId={messageId}
          videoId={Number(videoId)}
          onHide={() => setModalShown(false)}
        />
      )}
    </div>
  );
}
