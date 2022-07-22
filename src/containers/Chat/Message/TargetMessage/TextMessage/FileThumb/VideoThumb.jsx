import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import ExtractedThumb from '~/components/ExtractedThumb';
import LocalContext from '../../../../Context';
import playButtonImg from '~/assets/play-button-image.png';
import ErrorBoundary from '~/components/ErrorBoundary';
import { returnImageFileFromUrl } from '~/helpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { v1 as uuidv1 } from 'uuid';

VideoThumb.propTypes = {
  messageId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  thumbUrl: PropTypes.string,
  src: PropTypes.string,
  onClick: PropTypes.func
};

export default function VideoThumb({ messageId, onClick, thumbUrl, src }) {
  const [thumbnailLoadFail, setThumbnailLoadFail] = useState(false);
  const {
    requests: { uploadThumb }
  } = useContext(LocalContext);

  return (
    <ErrorBoundary componentPath="Message/TargetMessage/FileThumb/VideoThumb">
      <div
        onClick={onClick}
        style={{
          width: '100%',
          cursor: 'pointer',
          position: 'relative'
        }}
        className={css`
          height: 7rem;
          @media (max-width: ${mobileMaxWidth}) {
            height: 5rem;
          }
        `}
      >
        {thumbnailLoadFail ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: Color.black()
            }}
          />
        ) : (
          <ExtractedThumb
            style={{ width: '100%', height: '100%' }}
            src={src}
            thumbUrl={thumbUrl}
            onThumbnailLoad={handleThumbnailLoad}
            onThumbnailLoadFail={() => setThumbnailLoadFail(true)}
          />
        )}
        <img
          style={{
            top: 'CALC(50% - 1.5rem)',
            left: 'CALC(50% - 1.5rem)',
            position: 'absolute',
            width: '3rem',
            height: '3rem'
          }}
          src={playButtonImg}
        />
      </div>
    </ErrorBoundary>
  );

  function handleThumbnailLoad(thumb) {
    const file = returnImageFileFromUrl({ imageUrl: thumb });
    uploadThumb({
      contentType: 'chat',
      contentId: messageId,
      file,
      path: uuidv1()
    });
  }
}
