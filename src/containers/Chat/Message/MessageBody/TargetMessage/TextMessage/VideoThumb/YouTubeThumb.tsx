import React, { useState } from 'react';
import YouTubeIcon from '~/assets/YoutubeIcon.svg';
import YTVideoModal from './YTVideoModal';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function YouTubeThumb({
  messageId,
  style,
  thumbUrl,
  videoUrl
}: {
  messageId: number;
  style: React.CSSProperties;
  thumbUrl: string;
  videoUrl: string;
}) {
  const [modalShown, setModalShown] = useState(false);
  return (
    <div style={style}>
      <div
        className={`unselectable ${css`
          width: 100%;
          height: 7rem;
          position: relative;
          @media (max-width: ${mobileMaxWidth}) {
            height: 5rem;
          }
        `}`}
      >
        <img
          loading="lazy"
          style={{
            cursor: 'pointer',
            width: '100%',
            height: '100%',
            display: 'flex'
          }}
          src={thumbUrl}
          onClick={() => setModalShown(true)}
        />
        <img
          loading="lazy"
          style={{
            cursor: 'pointer',
            top: 'CALC(50% - 2rem)',
            left: 'CALC(50% - 3rem)',
            position: 'absolute',
            height: '4rem',
            width: '6rem'
          }}
          src={YouTubeIcon}
          onClick={() => setModalShown(true)}
        />
      </div>
      {modalShown && (
        <YTVideoModal
          messageId={messageId}
          url={videoUrl}
          onHide={() => setModalShown(false)}
        />
      )}
    </div>
  );
}
