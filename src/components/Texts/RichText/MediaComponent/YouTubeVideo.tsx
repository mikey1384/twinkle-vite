import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { isMobile } from '~/helpers';
import { css } from '@emotion/css';
import { fetchedVideoCodeFromURL } from '~/helpers/stringHelpers';
import YoutubeIcon from '~/assets/YoutubeIcon.svg';

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
  return (
    <div
      className={css`
        position: relative;
        padding-top: 56.25%;
      `}
    >
      {isStarted ? (
        <ReactPlayer
          {...commonProps}
          url={src}
          onReady={onReady}
          width="100%"
          height="100%"
          style={{
            position: 'absolute',
            top: 0,
            left: 0
          }}
        />
      ) : (
        <div
          onClick={() => setIsStarted(true)}
          className={css`
            position: absolute;
            top: 0;
            left: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            background: url(https://i.ytimg.com/vi/${fetchedVideoCodeFromURL(
                src
              )}/mqdefault.jpg)
              no-repeat center;
            background-size: cover;
          `}
        >
          <img style={{ height: '8rem', width: '12rem' }} src={YoutubeIcon} />
        </div>
      )}
    </div>
  );
}
