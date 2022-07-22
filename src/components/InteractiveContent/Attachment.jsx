import React from 'react';
import PropTypes from 'prop-types';
import ReactPlayer from 'react-player';
import FileViewer from '~/components/FileViewer';
import SlideEmbedly from './SlideEmbedly';
import { mobileMaxWidth } from '~/constants/css';
import { fetchedVideoCodeFromURL } from '~/helpers/stringHelpers';
import { useAppContext, useInteractiveContext } from '~/contexts';
import { v1 as uuidv1 } from 'uuid';
import { css } from '@emotion/css';
import { returnImageFileFromUrl } from '~/helpers';

Attachment.propTypes = {
  small: PropTypes.bool,
  type: PropTypes.string,
  fileUrl: PropTypes.string,
  interactiveId: PropTypes.number,
  linkUrl: PropTypes.string,
  isOnModal: PropTypes.bool,
  isYouTubeVideo: PropTypes.bool,
  onSetEmbedProps: PropTypes.func.isRequired,
  thumbUrl: PropTypes.string,
  actualTitle: PropTypes.string,
  actualDescription: PropTypes.string,
  onThumbnailUpload: PropTypes.func,
  prevUrl: PropTypes.string,
  slideId: PropTypes.number,
  siteUrl: PropTypes.string,
  videoHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default function Attachment({
  small,
  type,
  fileUrl,
  interactiveId,
  linkUrl,
  isOnModal,
  isYouTubeVideo,
  onSetEmbedProps,
  thumbUrl,
  actualTitle,
  actualDescription,
  onThumbnailUpload,
  prevUrl,
  slideId,
  siteUrl,
  videoHeight
}) {
  const uploadThumbForInteractiveSlide = useAppContext(
    (v) => v.requestHelpers.uploadThumbForInteractiveSlide
  );
  const onChangeNumUpdates = useInteractiveContext(
    (v) => v.actions.onChangeNumUpdates
  );

  switch (type) {
    case 'file':
      return (
        <div
          className={`unselectable ${css`
            width: 80%;
            height: 100%;
            margin-top: 1rem;
            @media (max-width: ${mobileMaxWidth}) {
              width: 100%;
            }
          `}`}
        >
          <FileViewer
            showImageModalOnClick
            isOnModal={isOnModal}
            small={small}
            thumbUrl={thumbUrl}
            src={fileUrl}
            onThumbnailLoad={handleThumbnailLoad}
          />
        </div>
      );
    case 'link':
      return isYouTubeVideo ? (
        small ? (
          <img
            className="unselectable"
            style={{ marginTop: '1rem', height: '20rem' }}
            src={`https://i.ytimg.com/vi/${fetchedVideoCodeFromURL(
              linkUrl
            )}/mqdefault.jpg`}
          />
        ) : (
          <div
            className="unselectable"
            style={{
              width: '100%',
              paddingTop: '57.25%',
              marginTop: '1rem',
              position: 'relative'
            }}
          >
            <ReactPlayer
              width="100%"
              height={videoHeight || '100%'}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                left: 0,
                bottom: 0
              }}
              url={linkUrl}
              controls
            />
          </div>
        )
      ) : (
        <SlideEmbedly
          className="unselectable"
          style={{ marginTop: '3rem', width: '50%' }}
          url={linkUrl}
          onSetEmbedProps={onSetEmbedProps}
          thumbUrl={thumbUrl}
          actualTitle={actualTitle}
          actualDescription={actualDescription}
          prevUrl={prevUrl}
          interactiveId={interactiveId}
          slideId={slideId}
          siteUrl={siteUrl}
        />
      );
    default:
      return null;
  }

  function handleThumbnailLoad(thumb) {
    const file = returnImageFileFromUrl({ imageUrl: thumb });
    handleUploadThumb();

    async function handleUploadThumb() {
      const { thumbUrl, numUpdates } = await uploadThumbForInteractiveSlide({
        slideId,
        file,
        path: uuidv1()
      });
      onChangeNumUpdates({ interactiveId, numUpdates });
      onThumbnailUpload(thumbUrl);
    }
  }
}
