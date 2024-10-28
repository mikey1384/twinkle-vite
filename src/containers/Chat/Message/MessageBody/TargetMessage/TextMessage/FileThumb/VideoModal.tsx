import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import VideoPlayer from '~/components/VideoPlayer';
import { useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

const closelLabel = localize('close');

export default function VideoModal({
  fileName,
  messageId,
  onHide,
  src
}: {
  fileName: string;
  messageId: number;
  onHide: () => void;
  src: string;
}) {
  const onSetVideoCurrentTime = useContentContext(
    (v) => v.actions.onSetVideoCurrentTime
  );
  const { currentTime = 0 } = useContentState({
    contentType: 'chat',
    contentId: messageId
  });
  const timeAtRef = useRef(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return function setCurrentTimeBeforeUnmount() {
      if (timeAtRef.current > 0) {
        onSetVideoCurrentTime({
          contentType: 'chat',
          contentId: messageId,
          currentTime: timeAtRef.current
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            style={{
              width: '100%'
            }}
          >
            <a
              className={css`
                font-weight: bold;
                font-size: 1.7rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.5rem;
                }
              `}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
            >
              {fileName}
            </a>
          </div>
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
              fileType="video"
              src={src}
              playing={playing}
              initialTime={currentTime}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onProgress={(currentTime) => {
                timeAtRef.current = currentTime;
              }}
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
