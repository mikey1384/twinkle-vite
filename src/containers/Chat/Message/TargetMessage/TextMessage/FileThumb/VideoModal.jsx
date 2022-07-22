import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import ReactPlayer from 'react-player';
import { useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

const closelLabel = localize('close');

VideoModal.propTypes = {
  fileName: PropTypes.string.isRequired,
  messageId: PropTypes.number.isRequired,
  onHide: PropTypes.func.isRequired,
  src: PropTypes.string.isRequired
};

export default function VideoModal({ fileName, messageId, onHide, src }) {
  const onSetVideoCurrentTime = useContentContext(
    (v) => v.actions.onSetVideoCurrentTime
  );
  const { currentTime = 0 } = useContentState({
    contentType: 'chat',
    contentId: messageId
  });
  const timeAtRef = useRef(0);
  const PlayerRef = useRef(null);

  useEffect(() => {
    if (currentTime > 0) {
      PlayerRef.current?.seekTo(currentTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <ReactPlayer
              ref={PlayerRef}
              playsinline
              width="100%"
              height="100%"
              className={css`
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
              `}
              url={src}
              controls
              onProgress={handleVideoProgress}
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

  function handleVideoProgress() {
    timeAtRef.current = PlayerRef.current.getCurrentTime();
  }
}
