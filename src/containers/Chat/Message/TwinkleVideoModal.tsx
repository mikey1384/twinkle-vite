import React from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import XPVideoPlayer from './XPVideoPlayer';
import ErrorBoundary from '~/components/ErrorBoundary';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';

const closelLabel = localize('close');

export default function TwinkleVideoModal({
  videoId,
  onHide,
  messageId
}: {
  videoId: number;
  messageId: number;
  onHide: () => void;
}) {
  const onSetMediaStarted = useContentContext(
    (v) => v.actions.onSetMediaStarted
  );
  const { loaded, notFound, content, rewardLevel } = useContentState({
    contentId: videoId,
    contentType: 'video'
  });

  return (
    <ErrorBoundary componentPath="container/Chat/Message/TwinkleVideoModal">
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
              display: 'flex',
              width: '100%',
              height: '100%',
              justifyContent: 'center'
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
              {notFound ? (
                <div>Video Not Found</div>
              ) : (
                <XPVideoPlayer
                  loaded={loaded}
                  style={{ width: '100%', height: '100%' }}
                  rewardLevel={rewardLevel}
                  videoCode={content}
                  videoId={videoId}
                  onPlay={handlePlay}
                />
              )}
            </div>
          </div>
        </main>
        <footer>
          <Button
            transparent
            style={{ marginRight: '0.7rem' }}
            onClick={onHide}
          >
            {closelLabel}
          </Button>
        </footer>
      </Modal>
    </ErrorBoundary>
  );

  function handlePlay() {
    onSetMediaStarted({
      contentType: 'chat',
      contentId: messageId,
      started: true
    });
  }
}
