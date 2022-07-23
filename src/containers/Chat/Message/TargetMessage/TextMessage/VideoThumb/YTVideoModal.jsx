import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import ReactPlayer from 'react-player/youtube';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';

const closelLabel = localize('close');

YTVideoModal.propTypes = {
  messageId: PropTypes.number.isRequired,
  onHide: PropTypes.func.isRequired,
  url: PropTypes.string.isRequired
};

export default function YTVideoModal({ messageId, onHide, url }) {
  const YTPlayerRef = useRef(null);
  const [timeAt, setTimeAt] = useState(0);
  const [startingPosition, setStartingPosition] = useState(0);
  const onSetVideoCurrentTime = useContentContext(
    (v) => v.actions.onSetVideoCurrentTime
  );
  const { currentTime = 0 } = useContentState({
    contentType: 'chat',
    contentId: messageId
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setStartingPosition(currentTime), []);
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

  const videoUrl = useMemo(
    () => `${url}${startingPosition > 0 ? `?t=${startingPosition}` : ''}`,
    [startingPosition, url]
  );

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
            <ReactPlayer
              ref={YTPlayerRef}
              width="100%"
              height="100%"
              className={css`
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
              `}
              url={videoUrl}
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
    setTimeAt(YTPlayerRef.current.getCurrentTime());
  }
}
