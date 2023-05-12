import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { isMobile } from '~/helpers';
import { css } from '@emotion/css';
import { fetchedVideoCodeFromURL } from '~/helpers/stringHelpers';
import playButtonImg from '~/assets/play-button-image.png';

const displayIsMobile = isMobile(navigator);

export default function YouTubeVideo({
  src,
  onReady,
  ...commonProps
}: {
  src: string;
  onReady: () => void;
}) {
  const [isStarted, setIsStarted] = useState(!displayIsMobile);
  return isStarted ? (
    <ReactPlayer {...commonProps} url={src} onReady={onReady} />
  ) : (
    <div
      onClick={() => setIsStarted(true)}
      className={css`
        display: flex;
        justify-content: center;
        align-items: center;
        top: 0;
        left: 0;
        z-index: 1;
        width: 100%;
        height: 100%;
        background: url(https://i.ytimg.com/vi/${fetchedVideoCodeFromURL(
            src
          )}/mqdefault.jpg)
          no-repeat center;
        background-size: 100% auto;
      `}
    >
      <img style={{ width: '45px', height: '45px' }} src={playButtonImg} />
    </div>
  );
}
