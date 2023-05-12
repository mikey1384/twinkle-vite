import React, { useMemo, useState } from 'react';
import ReactPlayer from 'react-player';
import { isMobile } from '~/helpers';
import { css } from '@emotion/css';
import { fetchedVideoCodeFromURL } from '~/helpers/stringHelpers';
import { useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import YoutubeIcon from '~/assets/YoutubeIcon.svg';

const displayIsMobile = isMobile(navigator);

export default function YouTubeVideo({
  contentType,
  contentId,
  src,
  onReady,
  ...commonProps
}: {
  contentType?: string;
  contentId?: number;
  src: string;
  onReady: () => void;
}) {
  const onSetMediaStarted = useContentContext(
    (v) => v.actions.onSetMediaStarted
  );
  const videoCode = useMemo(() => fetchedVideoCodeFromURL(src), [src]);
  const { started } = useContentState({
    contentType: contentType || '',
    contentId: contentId || 0
  });
  const [isStarted, setIsStarted] = useState(!displayIsMobile || started);
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
          onClick={() => {
            setIsStarted(true);
            if (contentType && contentId) {
              onSetMediaStarted({ contentId, contentType, started: true });
            }
          }}
          className={css`
            position: absolute;
            top: 0;
            left: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            background: url(https://i.ytimg.com/vi/${videoCode}/mqdefault.jpg)
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
