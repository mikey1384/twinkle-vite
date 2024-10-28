import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import VideoPlayer from '~/components/VideoPlayer';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';

const closelLabel = localize('close');

export default function YTVideoModal({
  messageId,
  onHide,
  url
}: {
  messageId: number;
  onHide: () => void;
  url: string;
}) {
  const [timeAt, setTimeAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const onSetVideoCurrentTime = useContentContext(
    (v) => v.actions.onSetVideoCurrentTime
  );
  const { currentTime = 0 } = useContentState({
    contentType: 'chat',
    contentId: messageId
  });

  useEffect(() => {
    return function setCurrentTimeBeforeUnmount() {
      if (timeAt > 0) {
        onSetVideoCurrentTime({
          contentType: 'chat',
          contentId: messageId,
          currentTime: timeAt
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeAt]);

  const videoId = url.match(
    /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=|\/sandalsResorts#\w\/\w\/.*\/))([^/&]{10,12})/
  )?.[1];

  return (
    <Modal large onHide={onHide}>
      <header>Video Player</header>
      <main
        style={{
          fontSize: '3rem',
          paddingTop: 0
        }}
      >
        <div
          style={{
            display: 'block',
            height: '100%'
          }}
          className={css`
            width: 85%;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}
        >
          <div
            className={css`
              position: relative;
              padding-top: 56.25%;
            `}
          >
            <VideoPlayer
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1
              }}
              width="100%"
              height="100%"
              fileType="youtube"
              src={videoId || ''}
              playing={playing}
              initialTime={currentTime}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onProgress={setTimeAt}
              playsInline
            />
          </div>
        </div>
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          {closelLabel}
        </Button>
      </footer>
    </Modal>
  );
}
